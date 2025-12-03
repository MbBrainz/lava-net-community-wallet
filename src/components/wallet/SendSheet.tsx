"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  AlertCircle,
  Scan,
  User,
  ChevronDown,
} from "lucide-react";
import { Sheet } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { isValidAddress } from "@/lib/wallet";
import { formatTokenAmount } from "@/lib/utils";
import { type ChainId, CHAIN_CONFIGS } from "@/lib/chains/registry";

interface SendSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendSheet({ isOpen, onClose }: SendSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { arbitrumLavaBalance, baseLavaBalance, totalLavaBalance } = useApp();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedChain, setSelectedChain] = useState<ChainId>(42161); // Default to Arbitrum
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setRecipient("");
      setAmount("");
      setMemo("");
      setError(null);
      setSelectedChain(42161);
    }
  }, [isOpen]);

  // Get balance for selected chain
  const getChainBalance = (chainId: ChainId) => {
    if (chainId === 42161) return arbitrumLavaBalance;
    if (chainId === 8453) return baseLavaBalance;
    return 0;
  };

  const availableBalance = getChainBalance(selectedChain);
  const chainConfig = CHAIN_CONFIGS[selectedChain];

  // Validate recipient address (EVM format)
  const validateRecipient = (address: string): boolean => {
    if (!address) return false;
    return isValidAddress(address);
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
    setAmount(availableBalance.toString());
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
        setError("Invalid address format");
        return;
      }

      // Check if sending to self
      if (recipient.toLowerCase() === user?.walletAddress?.toLowerCase()) {
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
        setError("Insufficient balance on selected chain");
        return;
      }

      // Navigate to confirmation page
      const params = new URLSearchParams({
        type: "send",
        amount: numAmount.toString(),
        recipient,
        memo: memo || "",
        chainId: selectedChain.toString(),
        token: "LAVA",
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
    recipient.toLowerCase() !== user?.walletAddress?.toLowerCase();

  // Chain options
  const chainOptions = [
    { chainId: 42161 as ChainId, name: "Arbitrum", balance: arbitrumLavaBalance, icon: "🔷" },
    { chainId: 8453 as ChainId, name: "Base", balance: baseLavaBalance, icon: "🔵" },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Send LAVA">
      <div className="space-y-5">
        {/* Chain selector */}
        <div>
          <label className="block text-sm text-grey-200 mb-2">From Chain</label>
          <button
            onClick={() => setShowChainSelector(!showChainSelector)}
            className="w-full flex items-center justify-between bg-grey-650 border border-grey-425 rounded-xl px-4 py-3 text-white hover:border-grey-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {chainOptions.find((c) => c.chainId === selectedChain)?.icon}
              </span>
              <div className="text-left">
                <p className="text-sm font-medium">{chainConfig.displayName}</p>
                <p className="text-xs text-grey-200">
                  {formatTokenAmount(availableBalance)} LAVA available
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-grey-200 transition-transform ${showChainSelector ? "rotate-180" : ""}`} />
          </button>
          
          {showChainSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 space-y-1"
            >
              {chainOptions.map((chain) => (
                <button
                  key={chain.chainId}
                  onClick={() => {
                    setSelectedChain(chain.chainId);
                    setShowChainSelector(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    selectedChain === chain.chainId
                      ? "bg-lava-orange/20 border border-lava-orange/40"
                      : "bg-grey-650/50 hover:bg-grey-650"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{chain.icon}</span>
                    <span className="text-sm text-white">{chain.name}</span>
                  </div>
                  <span className="text-sm text-grey-200">
                    {formatTokenAmount(chain.balance)} LAVA
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Recipient input */}
        <div>
          <label className="block text-sm text-grey-200 mb-2">Recipient</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-grey-200" />
            <input
              type="text"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder="0x..."
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
            Available on {chainConfig.displayName}: {formatTokenAmount(availableBalance)} LAVA
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
                {formatTokenAmount(parseFloat(amount))} LAVA
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">On chain</span>
              <span className="text-white">{chainConfig.displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-200">Network fee</span>
              <span className="text-white">~0.0001 ETH</span>
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
