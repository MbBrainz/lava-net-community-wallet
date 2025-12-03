"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, Download } from "lucide-react";
import QRCode from "qrcode";
import { Sheet } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { shortenAddress } from "@/lib/utils";

interface ReceiveSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cache key prefix for localStorage
const QR_CACHE_KEY = "wallet_qr_cache_";

// Get cached QR code from localStorage
function getCachedQRCode(address: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(QR_CACHE_KEY + address);
    return cached;
  } catch {
    return null;
  }
}

// Save QR code to localStorage
function setCachedQRCode(address: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QR_CACHE_KEY + address, dataUrl);
  } catch (error) {
    console.warn("[ReceiveSheet] Could not cache QR code:", error);
  }
}

export function ReceiveSheet({ isOpen, onClose }: ReceiveSheetProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const walletAddress = user?.walletAddress || "";

  // Generate QR code using the qrcode library
  const generateQRCode = useCallback(async (address: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(address, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      });
      
      // Cache the generated QR code
      setCachedQRCode(address, dataUrl);
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("[ReceiveSheet] QR code generation error:", error);
    }
  }, []);

  // Load cached QR code immediately, then regenerate fresh one
  useEffect(() => {
    if (isOpen && walletAddress) {
      // First, try to show cached QR code instantly
      const cached = getCachedQRCode(walletAddress);
      if (cached) {
        setQrCodeDataUrl(cached);
      }
      
      // Then generate a fresh QR code (and update cache)
      generateQRCode(walletAddress);
    }
  }, [isOpen, walletAddress, generateQRCode]);

  // Copy address to clipboard (for copy button)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("[ReceiveSheet] Copy error:", error);
    }
  };

  // Copy address to clipboard (for address click)
  const handleAddressCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      // Also trigger the copy button animation
      setCopied(true);
      setTimeout(() => {
        setAddressCopied(false);
        setCopied(false);
      }, 2000);
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
                className="w-[50vw] h-[50vw] max-w-[280px] max-h-[280px]"
              />
            ) : (
              <div className="w-[50vw] h-[50vw] max-w-[280px] max-h-[280px] bg-grey-100 animate-pulse rounded-lg" />
            )}
          </motion.div>
        </div>

        {/* Address display - clickable to copy */}
        <div className="text-center">
          <p className="text-sm text-grey-200 mb-2">Your Wallet Address</p>
          <motion.button
            onClick={handleAddressCopy}
            disabled={!walletAddress}
            className="w-full p-4 bg-grey-650 rounded-xl cursor-pointer hover:bg-grey-600 transition-colors group relative"
            whileTap={{ scale: 0.98 }}
          >
            <code className="text-sm text-white font-mono break-all">
              {walletAddress || "No wallet connected"}
            </code>
            
            {/* Copy feedback overlay */}
            <motion.div
              initial={false}
              animate={{
                opacity: addressCopied ? 1 : 0,
                scale: addressCopied ? 1 : 0.8,
              }}
              className="absolute inset-0 flex items-center justify-center bg-grey-650 rounded-xl"
            >
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Copied!</span>
              </div>
            </motion.div>
            
            {/* Tap to copy hint */}
            {!addressCopied && walletAddress && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-grey-650/80 rounded-xl">
                <div className="flex items-center gap-2 text-grey-100">
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">Tap to copy</span>
                </div>
              </div>
            )}
          </motion.button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            onClick={handleCopy}
            disabled={!walletAddress}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <motion.div
              initial={false}
              animate={{
                scale: copied ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </motion.div>
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
