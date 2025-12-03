"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { shortenAddress, formatLavaAmount } from "@/lib/utils";
import { getTxExplorerUrl, LAVA_CHAIN_CONFIG } from "@/lib/chains/lava";

// Transaction types that this view can handle
type TransactionType = "send" | "receive" | "stake" | "unstake" | "claim" | "connect";

interface TransactionDetails {
  type: TransactionType;
  amount?: number;
  recipient?: string;
  sender?: string;
  validator?: string;
  memo?: string;
  estimatedFee?: number;
  chainName?: string;
}

type ConfirmationStatus = "pending" | "signing" | "broadcasting" | "success" | "error";

function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Parse transaction details from URL params
  const txType = (searchParams.get("type") as TransactionType) || "send";
  const amount = parseFloat(searchParams.get("amount") || "0");
  const recipient = searchParams.get("recipient") || "";
  const memo = searchParams.get("memo") || "";
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [status, setStatus] = useState<ConfirmationStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Transaction details object
  const txDetails: TransactionDetails = {
    type: txType,
    amount,
    recipient,
    memo,
    estimatedFee: 0.001, // Estimated gas fee in LAVA
    chainName: "Lava",
  };

  // Get icon for transaction type
  const getIcon = () => {
    switch (txType) {
      case "send":
        return ArrowUpRight;
      case "receive":
        return ArrowDownLeft;
      default:
        return Shield;
    }
  };

  // Get title for transaction type
  const getTitle = () => {
    switch (txType) {
      case "send":
        return "Confirm Send";
      case "stake":
        return "Confirm Stake";
      case "unstake":
        return "Confirm Unstake";
      case "claim":
        return "Confirm Claim";
      case "connect":
        return "Confirm Connection";
      default:
        return "Confirm Transaction";
    }
  };

  // Handle confirm action
  const handleConfirm = async () => {
    setStatus("signing");
    setErrorMessage(null);

    try {
      // TODO: Implement actual transaction signing using Dynamic SDK
      // For now, we'll simulate the flow
      
      // Step 1: Sign the transaction
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("broadcasting");

      // Step 2: Broadcast the transaction
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success
      const mockTxHash = "LAVA" + Math.random().toString(36).substring(2, 15).toUpperCase();
      setTxHash(mockTxHash);
      setStatus("success");
    } catch (error) {
      console.error("[Confirm] Transaction error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed");
      setStatus("error");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Handle done (after success)
  const handleDone = () => {
    router.push(returnUrl);
  };

  const Icon = getIcon();

  // Render based on status
  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-grey-650">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">Transaction Sent!</h1>
          <p className="text-grey-200 mb-6">
            Your transaction has been broadcast to the network
          </p>

          {txHash && (
            <Card variant="glass" className="mb-6 p-4">
              <p className="text-xs text-grey-200 mb-1">Transaction Hash</p>
              <p className="text-sm text-white font-mono break-all">{txHash}</p>
              <a
                href={getTxExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-lava-orange mt-3 hover:underline"
              >
                <span>View in Explorer</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          )}

          <Button fullWidth size="lg" onClick={handleDone}>
            Done
          </Button>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-grey-650">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-lava-red/20 flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-10 h-10 text-lava-red" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-2">Transaction Failed</h1>
          <p className="text-grey-200 mb-6">
            {errorMessage || "Something went wrong. Please try again."}
          </p>

          <div className="space-y-3">
            <Button fullWidth size="lg" onClick={() => setStatus("pending")}>
              Try Again
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main confirmation view
  return (
    <div className="min-h-screen flex flex-col bg-grey-650">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={handleCancel}
          className="p-2 text-grey-200 hover:text-white hover:bg-grey-425 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">{getTitle()}</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {/* Amount display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-lava-gradient flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-white">
              {formatLavaAmount(amount)}
            </span>
            <span className="text-xl text-lava-orange">LAVA</span>
          </div>
        </motion.div>

        {/* Transaction details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="mb-6">
            <div className="space-y-4">
              {/* From */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-200">From</span>
                <span className="text-sm text-white font-mono">
                  {shortenAddress(user?.walletAddress || "", 8)}
                </span>
              </div>

              {/* To */}
              {recipient && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-200">To</span>
                  <span className="text-sm text-white font-mono">
                    {shortenAddress(recipient, 8)}
                  </span>
                </div>
              )}

              {/* Chain */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-200">Network</span>
                <span className="text-sm text-white">{LAVA_CHAIN_CONFIG.chainName}</span>
              </div>

              {/* Memo */}
              {memo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-200">Memo</span>
                  <span className="text-sm text-white truncate max-w-[200px]">
                    {memo}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-grey-425/50" />

              {/* Estimated fee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-200">Estimated Fee</span>
                <span className="text-sm text-white">
                  ~{txDetails.estimatedFee} LAVA
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Warning for large amounts */}
        {amount > 1000 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 p-4 bg-lava-yellow/10 border border-lava-yellow/20 rounded-xl mb-6"
          >
            <AlertTriangle className="w-5 h-5 text-lava-yellow flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Large Transaction</p>
              <p className="text-xs text-grey-200 mt-0.5">
                Please double-check the recipient address before confirming.
              </p>
            </div>
          </motion.div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 safe-area-bottom pb-4"
        >
          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            disabled={status === "signing" || status === "broadcasting"}
            className="flex items-center justify-center gap-2"
          >
            {status === "signing" || status === "broadcasting" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {status === "signing" ? "Signing..." : "Broadcasting..."}
                </span>
              </>
            ) : (
              <span>Confirm & Send</span>
            )}
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={handleCancel}
            disabled={status === "signing" || status === "broadcasting"}
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-grey-650">
        <Loader2 className="w-8 h-8 text-lava-orange animate-spin" />
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}

