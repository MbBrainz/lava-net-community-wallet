// Cosmos Wallet Service
// Provides signing and transaction functionality for Cosmos-based chains (Lava)

import { LAVA_CHAIN_CONFIG, toLavaMicro } from "@/lib/chains/lava";
import { StargateClient, SigningStargateClient, DeliverTxResponse } from "@cosmjs/stargate";
import { Coin } from "@cosmjs/amino";

// Transaction types
export interface SendTransaction {
  fromAddress: string;
  toAddress: string;
  amount: number; // in display units (LAVA, not ulava)
  memo?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

// Get a read-only Stargate client
export async function getStargateClient(): Promise<StargateClient | null> {
  const rpcUrl = LAVA_CHAIN_CONFIG.rpcUrl;
  if (!rpcUrl) {
    console.error("[CosmosWallet] RPC URL not configured");
    return null;
  }

  try {
    const client = await StargateClient.connect(rpcUrl);
    return client;
  } catch (error) {
    console.error("[CosmosWallet] Failed to connect to RPC:", error);
    return null;
  }
}

// Create a send transaction message
export function createSendMsg(
  fromAddress: string,
  toAddress: string,
  amount: number
): {
  typeUrl: string;
  value: {
    fromAddress: string;
    toAddress: string;
    amount: Coin[];
  };
} {
  return {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress,
      toAddress,
      amount: [
        {
          denom: LAVA_CHAIN_CONFIG.denom,
          amount: toLavaMicro(amount),
        },
      ],
    },
  };
}

// Estimate gas for a transaction
export async function estimateGas(
  client: SigningStargateClient,
  signerAddress: string,
  messages: { typeUrl: string; value: unknown }[],
  memo?: string
): Promise<number> {
  try {
    const gasEstimation = await client.simulate(signerAddress, messages, memo);
    // Add 20% buffer to gas estimation
    return Math.ceil(gasEstimation * 1.2);
  } catch (error) {
    console.error("[CosmosWallet] Gas estimation failed:", error);
    // Return a default gas amount if estimation fails
    return 200000;
  }
}

// Sign and broadcast a transaction
export async function signAndBroadcast(
  client: SigningStargateClient,
  signerAddress: string,
  messages: { typeUrl: string; value: unknown }[],
  memo?: string
): Promise<TransactionResult> {
  try {
    // Estimate gas
    const gasLimit = await estimateGas(client, signerAddress, messages, memo);

    // Define fee
    const fee = {
      amount: [
        {
          denom: LAVA_CHAIN_CONFIG.denom,
          amount: Math.ceil(gasLimit * 0.025).toString(), // 0.025 ulava per gas
        },
      ],
      gas: gasLimit.toString(),
    };

    // Sign and broadcast
    const result: DeliverTxResponse = await client.signAndBroadcast(
      signerAddress,
      messages,
      fee,
      memo || ""
    );

    // Check if transaction was successful
    if (result.code !== 0) {
      return {
        success: false,
        error: result.rawLog || "Transaction failed",
        txHash: result.transactionHash,
      };
    }

    return {
      success: true,
      txHash: result.transactionHash,
      gasUsed: result.gasUsed.toString(),
    };
  } catch (error) {
    console.error("[CosmosWallet] Transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction failed",
    };
  }
}

// Format transaction for display
export function formatTxForDisplay(tx: DeliverTxResponse): {
  hash: string;
  success: boolean;
  gasUsed: string;
  gasWanted: string;
  height: number;
} {
  return {
    hash: tx.transactionHash,
    success: tx.code === 0,
    gasUsed: tx.gasUsed.toString(),
    gasWanted: tx.gasWanted.toString(),
    height: tx.height,
  };
}

