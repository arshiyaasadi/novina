"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";

type Phase = "permission" | "camera" | "recording" | "upload";

export interface VideoVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** پس از نمایش «احراز هویت موفق» فراخوانی می‌شود؛ والد مودال را می‌بندد و به مرحله بعد می‌رود */
  onSuccess: () => void;
}

const RECORD_DURATION_SEC = 5;
const UPLOAD_FAKE_MS = 2000;

export function VideoVerificationModal({
  open,
  onOpenChange,
  onSuccess,
}: VideoVerificationModalProps) {
  const [phase, setPhase] = useState<Phase>("permission");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setPhase("camera");
    } catch (err) {
      setPermissionError(
        "دسترسی به دوربین یا میکروفون داده نشد. لطفاً در تنظیمات مرورگر اجازه دهید."
      );
    }
  };

  // وقتی به فاز دوربین/ضبط می‌رویم، ویدیو الان در DOM است؛ استریم را به آن وصل می‌کنیم
  useEffect(() => {
    if ((phase === "camera" || phase === "recording") && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const startRecording = () => {
    setPhase("recording");
    setCountdown(RECORD_DURATION_SEC);
  };

  useEffect(() => {
    if (phase !== "recording" || countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setPhase("upload");
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "upload") return;
    const t = setTimeout(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      onOpenChange(false);
      onSuccess();
    }, UPLOAD_FAKE_MS);
    return () => clearTimeout(t);
  }, [phase, onOpenChange, onSuccess]);

  useEffect(() => {
    if (!open) {
      setPhase("permission");
      setPermissionError(null);
      setCountdown(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-background">
      <header className="shrink-0 flex items-center justify-center border-b px-4 py-3">
        <h2 className="text-lg font-semibold">احراز هویت ویدیویی</h2>
      </header>

      <div className="flex-1 flex flex-col min-h-0 p-4">
        {phase === "permission" && (
          <div className="flex flex-col items-center justify-center flex-1 space-y-6 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              برای ضبط ویدیو به دسترسی دوربین و میکروفون نیاز داریم. در پنجره مرورگر اجازه دسترسی
              را بدهید.
            </p>
            {permissionError && (
              <p className="text-sm text-destructive max-w-sm">{permissionError}</p>
            )}
            <Button type="button" onClick={requestPermission}>
              اجازه دسترسی به دوربین و میکروفون
            </Button>
          </div>
        )}

        {phase === "camera" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <p className="text-sm font-medium text-center">از مفاد سند مطلع هستم</p>
            <Button type="button" className="w-full" onClick={startRecording}>
              شروع ضبط
            </Button>
          </div>
        )}

        {phase === "recording" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            {countdown !== null && (
              <div className="text-center">
                <span className="text-2xl font-bold tabular-nums">{countdown}</span>
                <span className="text-sm text-muted-foreground mr-1"> ثانیه</span>
              </div>
            )}
            <p className="text-sm font-medium text-center">از مفاد سند مطلع هستم</p>
            <Button type="button" className="w-full" disabled>
              در حال ضبط…
            </Button>
          </div>
        )}

        {phase === "upload" && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">در حال آپلود و بررسی…</p>
          </div>
        )}
      </div>
    </div>
  );
}
