"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Download } from "lucide-react";
import { Sheet } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { shortenAddress } from "@/lib/utils";

interface ReceiveSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiveSheet({ isOpen, onClose }: ReceiveSheetProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const walletAddress = user?.walletAddress || "";

  // Generate QR code when sheet opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      generateQRCode(walletAddress);
    }
  }, [isOpen, walletAddress]);

  // Generate QR code using canvas
  const generateQRCode = async (address: string) => {
    try {
      // Using a simple QR code generation approach
      // In production, you might want to use a library like qrcode
      const size = 200;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // For now, create a placeholder with the address
        // In production, use a proper QR code library
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = "#000000";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Scan to receive", size / 2, 20);
        ctx.fillText(shortenAddress(address, 10), size / 2, size - 20);

        // Simple placeholder pattern
        const cellSize = 4;
        const margin = 30;
        const dataSize = size - margin * 2;
        const cells = Math.floor(dataSize / cellSize);

        // Generate a deterministic pattern from address
        for (let i = 0; i < cells; i++) {
          for (let j = 0; j < cells; j++) {
            const charIndex = (i * cells + j) % address.length;
            const charCode = address.charCodeAt(charIndex);
            if (charCode % 2 === 0) {
              ctx.fillRect(
                margin + i * cellSize,
                margin + j * cellSize,
                cellSize - 1,
                cellSize - 1
              );
            }
          }
        }

        setQrCodeDataUrl(canvas.toDataURL("image/png"));
      }
    } catch (error) {
      console.error("[ReceiveSheet] QR code generation error:", error);
    }
  };

  // Copy address to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[ReceiveSheet] Copy error:", error);
    }
  };

  // Share address
  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback to copy
      handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "My Wallet Address",
        text: `My wallet address: ${walletAddress}`,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("[ReceiveSheet] Share error:", error);
      }
    }
  };

  // Download QR code
  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `wallet-${shortenAddress(walletAddress, 4)}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Receive">
      <div className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-white rounded-2xl"
          >
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeDataUrl}
                alt="Wallet QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-grey-100 animate-pulse rounded-lg" />
            )}
          </motion.div>
        </div>

        {/* Address display */}
        <div className="text-center">
          <p className="text-sm text-grey-200 mb-2">Your Wallet Address</p>
          <div className="p-4 bg-grey-650 rounded-xl">
            <code className="text-sm text-white font-mono break-all">
              {walletAddress || "No wallet connected"}
            </code>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={handleCopy}
            disabled={!walletAddress}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleShare}
            disabled={!walletAddress}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs">Share</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownloadQR}
            disabled={!qrCodeDataUrl}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Save QR</span>
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-grey-650/50 rounded-xl">
          <p className="text-xs text-grey-200">
            <span className="text-grey-100 font-medium">Note:</span> Only send
            compatible tokens to this address. Sending incompatible tokens may
            result in permanent loss.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
