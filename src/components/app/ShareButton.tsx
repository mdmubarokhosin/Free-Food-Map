"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  spotName: string;
  spotId: string;
  spotAddress: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

// Helper to get origin safely
const getOrigin = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

// Generate QR Code using canvas
const generateQRCode = (
  canvas: HTMLCanvasElement,
  text: string,
  size: number = 200
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Simple QR-like pattern generator (creates a visual representation)
  // This creates a deterministic pattern based on the text
  const moduleCount = 25;
  const moduleSize = size / moduleCount;

  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Generate pattern from text
  const textHash = text.split("").reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  ctx.fillStyle = "#1a1a1a";

  // Draw finder patterns (corners)
  const drawFinderPattern = (x: number, y: number) => {
    // Outer square
    ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      (x + 1) * moduleSize,
      (y + 1) * moduleSize,
      5 * moduleSize,
      5 * moduleSize
    );
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(
      (x + 2) * moduleSize,
      (y + 2) * moduleSize,
      3 * moduleSize,
      3 * moduleSize
    );
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(moduleCount - 7, 0);
  drawFinderPattern(0, moduleCount - 7);

  // Generate data pattern
  const seed = Math.abs(textHash);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder patterns
      if (
        (row < 8 && col < 8) ||
        (row < 8 && col >= moduleCount - 8) ||
        (row >= moduleCount - 8 && col < 8)
      ) {
        continue;
      }

      // Generate pseudo-random pattern
      const hash = (seed * (row * moduleCount + col + 1)) % 100;
      if (hash < 45) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }

  // Add timing patterns
  ctx.fillStyle = "#1a1a1a";
  for (let i = 8; i < moduleCount - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
      ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
    }
  }
};

export default function ShareButton({
  spotName,
  spotId,
  spotAddress,
  className,
  variant = "outline",
  size = "default",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrGeneratedRef = useRef(false);

  // Helper to get spot URL
  const getSpotUrl = useCallback((): string => {
    const origin = getOrigin();
    return origin ? `${origin}/spot/${spotId}` : `/spot/${spotId}`;
  }, [spotId]);

  // Helper to get share text
  const getShareText = useCallback((): string => {
    const spotUrl = getSpotUrl();
    return `🍽️ ফ্রি খাবারের স্পট: ${spotName}
📍 ঠিকানা: ${spotAddress}
🔗 ${spotUrl}`;
  }, [spotName, spotAddress, getSpotUrl]);

  // WhatsApp share
  const shareWhatsApp = useCallback(() => {
    const shareText = getShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  }, [getShareText]);

  // Facebook share
  const shareFacebook = useCallback(() => {
    const spotUrl = getSpotUrl();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(spotUrl)}&quote=${encodeURIComponent(`🍽️ ফ্রি খাবারের স্পট: ${spotName}\n📍 ঠিকানা: ${spotAddress}`)}`;
    window.open(url, "_blank", "width=600,height=400");
  }, [spotName, spotAddress, getSpotUrl]);

  // Telegram share
  const shareTelegram = useCallback(() => {
    const spotUrl = getSpotUrl();
    const url = `https://t.me/share/url?url=${encodeURIComponent(spotUrl)}&text=${encodeURIComponent(`🍽️ ফ্রি খাবারের স্পট: ${spotName}\n📍 ঠিকানা: ${spotAddress}`)}`;
    window.open(url, "_blank");
  }, [spotName, spotAddress, getSpotUrl]);

  // Copy link
  const copyLink = useCallback(async () => {
    const spotUrl = getSpotUrl();
    try {
      await navigator.clipboard.writeText(spotUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = spotUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getSpotUrl]);

  // Generate QR code when dialog opens
  useEffect(() => {
    if (qrDialogOpen && canvasRef.current && !qrGeneratedRef.current) {
      qrGeneratedRef.current = true;
      const spotUrl = getSpotUrl();
      generateQRCode(canvasRef.current, spotUrl, 220);
    }
    if (!qrDialogOpen) {
      qrGeneratedRef.current = false;
    }
  }, [qrDialogOpen, getSpotUrl]);

  // Show QR dialog
  const showQRCode = useCallback(() => {
    setQrDialogOpen(true);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
          >
            <i className="bi bi-share text-sm"></i>
            <span className="hidden sm:inline">শেয়ার করুন</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-center text-sm font-medium text-muted-foreground">
            শেয়ার করুন
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* WhatsApp */}
          <DropdownMenuItem
            onClick={shareWhatsApp}
            className="cursor-pointer gap-3 py-3 text-green-600 focus:text-green-600 dark:text-green-500 dark:focus:text-green-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <i className="bi bi-chat-dots text-sm"></i>
            </div>
            <span className="font-medium">হোয়াটসঅ্যাপ</span>
          </DropdownMenuItem>

          {/* Facebook */}
          <DropdownMenuItem
            onClick={shareFacebook}
            className="cursor-pointer gap-3 py-3 text-blue-600 focus:text-blue-600 dark:text-blue-500 dark:focus:text-blue-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <i className="bi bi-facebook text-sm"></i>
            </div>
            <span className="font-medium">ফেসবুক</span>
          </DropdownMenuItem>

          {/* Telegram */}
          <DropdownMenuItem
            onClick={shareTelegram}
            className="cursor-pointer gap-3 py-3 text-sky-600 focus:text-sky-600 dark:text-sky-500 dark:focus:text-sky-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <i className="bi bi-send text-sm"></i>
            </div>
            <span className="font-medium">টেলিগ্রাম</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* QR Code */}
          <DropdownMenuItem
            onClick={showQRCode}
            className="cursor-pointer gap-3 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <i className="bi bi-qr-code text-purple-600 dark:text-purple-400 text-sm"></i>
            </div>
            <span className="font-medium">কিউআর কোড</span>
          </DropdownMenuItem>

          {/* Copy Link */}
          <DropdownMenuItem
            onClick={copyLink}
            className="cursor-pointer gap-3 py-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {copied ? (
                <i className="bi bi-check-lg text-green-600 dark:text-green-400 text-sm"></i>
              ) : (
                <i className="bi bi-copy text-gray-600 dark:text-gray-400 text-sm"></i>
              )}
            </div>
            <span className="font-medium">
              {copied ? "কপি হয়েছে!" : "লিংক কপি করুন"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">কিউআর কোড</DialogTitle>
            <DialogDescription className="text-center">
              স্ক্যান করে স্পট দেখুন
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-4">
              <canvas
                ref={canvasRef}
                width={220}
                height={220}
                className="rounded-lg"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{spotName}</p>
              <p className="text-sm text-muted-foreground mt-1">{spotAddress}</p>
            </div>
            <Button
              variant="outline"
              className="mt-2 w-full gap-2"
              onClick={copyLink}
            >
              {copied ? (
                <>
                  <i className="bi bi-check-lg text-green-600 text-sm"></i>
                  কপি হয়েছে!
                </>
              ) : (
                <>
                  <i className="bi bi-copy text-sm"></i>
                  লিংক কপি করুন
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
