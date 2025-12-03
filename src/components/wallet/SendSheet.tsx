"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  AlertCircle,
  Scan,
  User,
} from "lucide-react";
import { Sheet } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { formatLavaAmount } from "@/lib/utils";
import { isValidLavaAddress, LAVA_CHAIN_CONFIG } from "@/lib/chains/lava";
import { WalletBalance } from "@/lib/wallet";

interface SendSheetProps {
  isOpen: boolean;
  onClose: () => void;
  balance: WalletBalance | null;
}

export function SendSheet({ isOpen, onClose, balance }: SendSheetProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setRecipient("");
      setAmount("");
      setMemo("");
      setError(null);
    }
  }, [isOpen]);

  // Available balance for sending
  const availableBalance = balance?.available || 0;

  // Validate recipient address
  const validateRecipient = (address: string): boolean => {
    if (!address) return false;
    return isValidLavaAddress(address);
  };

  // Validate amount
  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return false;
    if (num > availableBalance) return false;
    return true;
  };

  // Handle max button
  const handleMax = () => {
    // Leave some for gas fees
    const maxAmount = Math.max(0, availableBalance - 0.01);
    setAmount(maxAmount.toFixed(6));
    setError(null);
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    setAmount(value);
    setError(null);
  };

  // Handle recipient change
  const handleRecipientChange = (value: string) => {
    setRecipient(value.trim());
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    setIsValidating(true);

    try {
      // Validate recipient
      if (!recipient) {
        setError("Please enter a recipient address");
        return;
      }

      if (!validateRecipient(recipient)) {
        setError("Invalid Lava address format");
        return;
      }

      // Check if sending to self
      if (recipient === user?.walletAddress) {
        setError("Cannot send to your own address");
        return;
      }

      // Validate amount
      if (!amount || !validateAmount(amount)) {
        setError("Please enter a valid amount");
        return;
      }

      const numAmount = parseFloat(amount);

      if (numAmount > availableBalance) {
        setError("Insufficient balance");
        return;
      }

      // Navigate to confirmation page
      const params = new URLSearchParams({
        type: "send",
        amount: numAmount.toString(),
        recipient,
        memo: memo || "",
        returnUrl: "/",
      });

      onClose();
      router.push(`/confirm?${params.toString()}`);
    } catch (err) {
      console.error("[SendSheet] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  // Check if form is valid
  const isFormValid =
    recipient &&
    validateRecipient(recipient) &&
    amount &&
    validateAmount(amount) &&
    recipient !== user?.walletAddress;

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Send LAVA">
      <div className="space-y-5">
        {/* Recipient input */}
        <div>
          <label className="block text-sm text-grey-200 mb-2">Recipient</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-200" />
            <input
              type="text"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder={`${LAVA_CHAIN_CONFIG.bech32Prefix}1...`}
              className="w-full bg-grey-650 border border-grey-425 rounded-xl pl-11 pr-12 py-3 text-white placeholder:text-grey-200 focus:outline-none focus:border-lava-orange transition-colors font-mono text-sm"
            />
            <button
              onClick={() => {
                // TODO: Implement QR scanner
                console.log("Open QR scanner");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-grey-200 hover:text-white transition-colors"
            >
              <Scan className="w-5 h-5" />
            </button>
          </div>
          {recipient && !validateRecipient(recipient) && (
            <p className="text-xs text-lava-red mt-1">Invalid address format</p>
          )}
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm text-grey-200 mb-2">Amount</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-grey-650 border border-grey-425 rounded-xl px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-lava-orange transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-grey-200">LAVA</span>
              <button
                onClick={handleMax}
                className="text-xs text-lava-orange font-semibold hover:text-lava-spanish-orange transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
          <p className="text-xs text-grey-200 mt-2">
            Available: {formatLavaAmount(availableBalance)} LAVA
          </p>
        </div>

        {/* Memo input (optional) */}
        <div>
          <label className="block text-sm text-grey-200 mb-2">
            Memo <span className="text-grey-200">(optional)</span>
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note..."
            maxLength={256}
            className="w-full bg-grey-650 border border-grey-425 rounded-xl px-4 py-3 text-white placeholder:text-grey-200 focus:outline-none focus:border-lava-orange transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-lava-red/10 border border-lava-red/20 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-lava-red flex-shrink-0" />
            <p className="text-sm text-lava-red">{error}</p>
          </motion.div>
        )}

        {/* Summary */}
        {isFormValid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-grey-650/50 rounded-xl space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">You&apos;ll send</span>
              <span className="text-white font-medium">
                {formatLavaAmount(parseFloat(amount))} LAVA
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">Network fee</span>
              <span className="text-white">~0.001 LAVA</span>
            </div>
          </motion.div>
        )}

        {/* Submit button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={!isFormValid || isValidating}
          className="flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Review Send</span>
        </Button>
      </div>
    </Sheet>
  );
}

