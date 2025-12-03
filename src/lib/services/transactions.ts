// Transaction History Service
// Fetches and caches transaction history from Lava RPC
// Limited to 10 transactions, with deduplication
//
// Error Handling: All functions throw exceptions on failure.
// Callers should wrap in try/catch.

import { LAVA_CHAIN_CONFIG, formatLavaFromMicro } from "@/lib/chains/lava";
import { WalletTransaction, TransactionStatus } from "@/lib/wallet";

// Custom error class for transaction service errors
export class TransactionServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TransactionServiceError";
  }
}

// Constants
const MAX_TRANSACTIONS = 10;
const CACHE_TTL = 60000; // 1 minute

// Transaction cache with deduplication
interface TransactionCache {
  transactions: WalletTransaction[];
  timestamp: number;
}

const transactionCache = new Map<string, TransactionCache>();

// REST API response types
interface TxResponse {
  txhash: string;
  height: string;
  code?: number;
  timestamp: string;
  tx: {
    body: {
      messages: Array<{
        "@type": string;
        from_address?: string;
        to_address?: string;
        delegator_address?: string;
        validator_address?: string;
        amount?: {
          denom: string;
          amount: string;
        } | Array<{
          denom: string;
          amount: string;
        }>;
      }>;
      memo?: string;
    };
  };
}

interface TxSearchResponse {
  tx_responses: TxResponse[];
  pagination?: {
    total: string;
  };
}

// Determine transaction type from message type
function getTransactionType(
  msgType: string,
  address: string,
  fromAddress?: string,
  toAddress?: string
): WalletTransaction["type"] {
  if (msgType.includes("MsgSend")) {
    if (fromAddress === address) return "send";
    if (toAddress === address) return "receive";
  }
  if (msgType.includes("MsgDelegate")) return "stake";
  if (msgType.includes("MsgUndelegate")) return "unstake";
  if (msgType.includes("MsgWithdrawDelegatorReward")) return "claim";
  return "unknown";
}

// Parse a single transaction response
function parseTxResponse(
  tx: TxResponse,
  address: string
): WalletTransaction | null {
  try {
    const msg = tx.tx.body.messages[0];
    if (!msg) return null;

    const msgType = msg["@type"];
    const fromAddress = msg.from_address || msg.delegator_address || "";
    const toAddress = msg.to_address || msg.validator_address || "";

    // Get amount
    let amount = 0;
    if (msg.amount) {
      if (Array.isArray(msg.amount)) {
        const lavaAmount = msg.amount.find(
          (a) => a.denom === LAVA_CHAIN_CONFIG.denom
        );
        amount = lavaAmount ? formatLavaFromMicro(lavaAmount.amount) : 0;
      } else if (msg.amount.denom === LAVA_CHAIN_CONFIG.denom) {
        amount = formatLavaFromMicro(msg.amount.amount);
      }
    }

    const type = getTransactionType(msgType, address, fromAddress, toAddress);

    return {
      id: tx.txhash,
      hash: tx.txhash,
      type,
      status: tx.code === 0 || tx.code === undefined
        ? TransactionStatus.CONFIRMED
        : TransactionStatus.FAILED,
      amount,
      denom: LAVA_CHAIN_CONFIG.displayDenom,
      fromAddress,
      toAddress,
      timestamp: new Date(tx.timestamp),
      chainName: "lava",
      chainType: "cosmos",
      memo: tx.tx.body.memo,
      blockHeight: parseInt(tx.height, 10),
    };
  } catch (error) {
    console.error("[TxService] Failed to parse transaction:", error);
    return null;
  }
}

// Fetch transactions where address is sender
async function fetchSentTransactions(
  address: string
): Promise<TxResponse[]> {
  const restUrl = LAVA_CHAIN_CONFIG.restUrl;
  if (!restUrl) {
    throw new TransactionServiceError("REST URL not configured");
  }

  const query = encodeURIComponent(`message.sender='${address}'`);
  const response = await fetch(
    `${restUrl}/cosmos/tx/v1beta1/txs?events=${query}&order_by=ORDER_BY_DESC&pagination.limit=${MAX_TRANSACTIONS}`
  );

  if (!response.ok) {
    throw new TransactionServiceError(
      `Failed to fetch sent transactions: HTTP ${response.status}`
    );
  }

  const data: TxSearchResponse = await response.json();
  return data.tx_responses || [];
}

// Fetch transactions where address is recipient
async function fetchReceivedTransactions(
  address: string
): Promise<TxResponse[]> {
  const restUrl = LAVA_CHAIN_CONFIG.restUrl;
  if (!restUrl) {
    throw new TransactionServiceError("REST URL not configured");
  }

  const query = encodeURIComponent(`transfer.recipient='${address}'`);
  const response = await fetch(
    `${restUrl}/cosmos/tx/v1beta1/txs?events=${query}&order_by=ORDER_BY_DESC&pagination.limit=${MAX_TRANSACTIONS}`
  );

  if (!response.ok) {
    throw new TransactionServiceError(
      `Failed to fetch received transactions: HTTP ${response.status}`
    );
  }

  const data: TxSearchResponse = await response.json();
  return data.tx_responses || [];
}

// Main function to fetch transaction history
export async function fetchTransactionHistory(
  address: string,
  forceRefresh = false
): Promise<WalletTransaction[]> {
  // Check cache first
  const cacheKey = `txs:${address}`;
  const cached = transactionCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.transactions;
  }

  // Fetch sent and received transactions in parallel
  const [sentTxs, receivedTxs] = await Promise.all([
    fetchSentTransactions(address),
    fetchReceivedTransactions(address),
  ]);

  // Combine and deduplicate by txhash
  const txMap = new Map<string, TxResponse>();

  for (const tx of [...sentTxs, ...receivedTxs]) {
    if (!txMap.has(tx.txhash)) {
      txMap.set(tx.txhash, tx);
    }
  }

  // Parse transactions
  const transactions: WalletTransaction[] = [];
  for (const tx of txMap.values()) {
    const parsed = parseTxResponse(tx, address);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  // Sort by timestamp descending and limit
  transactions.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
  const limited = transactions.slice(0, MAX_TRANSACTIONS);

  // Update cache
  transactionCache.set(cacheKey, {
    transactions: limited,
    timestamp: Date.now(),
  });

  return limited;
}

// Add a new transaction to cache (for optimistic updates)
export function addTransactionToCache(
  address: string,
  transaction: WalletTransaction
): void {
  const cacheKey = `txs:${address}`;
  const cached = transactionCache.get(cacheKey);

  if (cached) {
    // Check for duplicates
    const exists = cached.transactions.some(
      (tx) => tx.hash === transaction.hash
    );

    if (!exists) {
      // Add to beginning and maintain limit
      const updated = [transaction, ...cached.transactions].slice(
        0,
        MAX_TRANSACTIONS
      );

      transactionCache.set(cacheKey, {
        transactions: updated,
        timestamp: Date.now(),
      });
    }
  } else {
    transactionCache.set(cacheKey, {
      transactions: [transaction],
      timestamp: Date.now(),
    });
  }
}

// Update transaction status in cache
export function updateTransactionStatus(
  address: string,
  txHash: string,
  status: TransactionStatus
): void {
  const cacheKey = `txs:${address}`;
  const cached = transactionCache.get(cacheKey);

  if (cached) {
    const updated = cached.transactions.map((tx) =>
      tx.hash === txHash ? { ...tx, status } : tx
    );

    transactionCache.set(cacheKey, {
      transactions: updated,
      timestamp: cached.timestamp,
    });
  }
}

// Clear transaction cache
export function clearTransactionCache(address?: string): void {
  if (address) {
    transactionCache.delete(`txs:${address}`);
  } else {
    transactionCache.clear();
  }
}
