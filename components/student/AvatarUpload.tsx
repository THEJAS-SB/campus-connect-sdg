"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAvatar } from "@/app/actions/generate-avatar";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const COMPRESS_MAX_DIM = 768; // max width/height before base64 encoding
const COMPRESS_QUALITY = 0.88;
const LS_KEY = "ai_avatar_url"; // localStorage key

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Resize + compress a File to a base64 JPEG data-URI on the client. */
function compressToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > COMPRESS_MAX_DIM || height > COMPRESS_MAX_DIM) {
        const ratio = Math.min(
          COMPRESS_MAX_DIM / width,
          COMPRESS_MAX_DIM / height,
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", COMPRESS_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

function formatBytes(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

/* ------------------------------------------------------------------ */
/*  Toast sub-component                                                 */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error";

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

function Toast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-2xl text-sm font-medium text-white backdrop-blur-sm ${
        type === "success"
          ? "bg-emerald-600/90 border border-emerald-400/40"
          : "bg-red-600/90 border border-red-400/40"
      }`}
    >
      <span className="text-base">{type === "success" ? "✨" : "⚠️"}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        ✕
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scan-line animation overlay                                         */
/* ------------------------------------------------------------------ */

function ScanOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
      {/* Pulsing tinted veil */}
      <motion.div
        className="absolute inset-0 bg-sky-500/20"
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Horizontal scan line */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_16px_4px_rgba(56,189,248,0.7)]"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />

      {/* Corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <div
          key={corner}
          className={`absolute w-6 h-6 border-sky-400 ${
            corner === "tl"
              ? "top-2 left-2 border-t-2 border-l-2"
              : corner === "tr"
                ? "top-2 right-2 border-t-2 border-r-2"
                : corner === "bl"
                  ? "bottom-2 left-2 border-b-2 border-l-2"
                  : "bottom-2 right-2 border-b-2 border-r-2"
          }`}
        />
      ))}

      {/* Label */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-sky-300 text-xs font-mono tracking-widest">
        AI PROCESSING…
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

interface AvatarUploadProps {
  /** Current avatar URL already saved on the profile (optional). */
  currentAvatarUrl?: string | null;
  /** Called after a new avatar URL is saved, so the parent can refresh. */
  onAvatarGenerated?: (url: string) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  onAvatarGenerated,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewDataUri, setPreviewDataUri] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(() => {
    // Hydrate from localStorage on first render
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_KEY) ?? currentAvatarUrl ?? null;
    }
    return currentAvatarUrl ?? null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  /* ── File validation & preview ─────────────────────────────────── */

  const handleFile = useCallback(async (file: File) => {
    setFileError(null);

    if (!file.type.startsWith("image/")) {
      setFileError("Please upload a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError(
        `File too large (${formatBytes(file.size)}). Maximum allowed is ${formatBytes(MAX_FILE_BYTES)}.`,
      );
      return;
    }

    setSelectedFile(file);
    // Show raw preview immediately (fast path)
    const objectUrl = URL.createObjectURL(file);
    setPreviewDataUri(objectUrl);
    setGeneratedUrl(null);
  }, []);

  /* ── Drag & drop handlers ──────────────────────────────────────── */

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  /* ── Generate ──────────────────────────────────────────────────── */

  const handleGenerate = async () => {
    if (!selectedFile || isGenerating) return;

    setIsGenerating(true);
    setFileError(null);

    try {
      // Compress & encode before sending to the server action
      const dataUri = await compressToDataUri(selectedFile);

      const result = await generateAvatar(dataUri);

      if (!result.success) {
        setToast({ type: "error", message: result.error });
        return;
      }

      // ── Persist in localStorage ──────────────────────────────────
      localStorage.setItem(LS_KEY, result.avatarUrl);

      setGeneratedUrl(result.avatarUrl);
      setPreviewDataUri(null);
      setSelectedFile(null);

      setToast({
        type: "success",
        message: "Your AI avatar is ready! Profile updated. ✨",
      });

      onAvatarGenerated?.(result.avatarUrl);
    } catch {
      setToast({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Reset ──────────────────────────────────────────────────────── */

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewDataUri(null);
    setGeneratedUrl(null);
    setFileError(null);
    localStorage.removeItem(LS_KEY);
  };

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <>
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            AI Profile Avatar
          </h2>
          <p className="text-xs text-white/50">
            Upload your photo — we'll transform it into a Pixar-style 3D avatar.
          </p>
        </div>

        {/* ── Current / generated avatar preview ───────────────── */}
        {generatedUrl && (
          <motion.div
            key="generated"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mx-auto w-36 h-36"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-sky-500 via-violet-500 to-pink-500 blur-lg opacity-60 scale-110" />
            <img
              src={generatedUrl}
              alt="Generated AI avatar"
              className="relative z-10 w-36 h-36 rounded-full object-cover border-2 border-white/20 shadow-xl"
            />
            <button
              onClick={handleReset}
              title="Upload a new photo"
              className="absolute -top-1 -right-1 z-20 w-7 h-7 rounded-full bg-slate-800 border border-white/20 text-white/70 text-xs flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              ↺
            </button>
          </motion.div>
        )}

        {/* ── Upload zone ────────────────────────────────────────── */}
        {!generatedUrl && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload photo"
            onClick={() => !isGenerating && fileInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !isGenerating &&
              fileInputRef.current?.click()
            }
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden select-none
              ${
                isDragging
                  ? "border-sky-400 bg-sky-500/10 scale-[1.02]"
                  : "border-white/15 bg-white/5 hover:border-sky-400/60 hover:bg-white/8"
              }
              ${isGenerating ? "pointer-events-none" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-hidden="true"
              onChange={onInputChange}
              disabled={isGenerating}
            />

            {/* ─ No file yet ─ */}
            {!previewDataUri && (
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-2xl">
                  🤳
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {isDragging ? "Drop it here!" : "Click or drag & drop"}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    JPEG · PNG · WEBP — up to 5 MB
                  </p>
                </div>
              </div>
            )}

            {/* ─ Preview with scan overlay ─ */}
            {previewDataUri && (
              <div className="relative">
                <img
                  src={previewDataUri}
                  alt="Your photo preview"
                  className="w-full max-h-64 object-cover rounded-2xl"
                  style={{ display: "block" }}
                />
                {isGenerating && <ScanOverlay />}
              </div>
            )}
          </div>
        )}

        {/* ── File error ─────────────────────────────────────────── */}
        <AnimatePresence>
          {fileError && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-400 text-center"
            >
              {fileError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Generate button ────────────────────────────────────── */}
        <AnimatePresence>
          {previewDataUri && !generatedUrl && (
            <motion.button
              key="gen-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`relative w-full rounded-xl py-3 px-6 text-sm font-semibold text-white overflow-hidden transition-all duration-200
                ${
                  isGenerating
                    ? "bg-sky-600/40 cursor-not-allowed"
                    : "bg-linear-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 shadow-lg hover:shadow-sky-500/30 active:scale-[0.98]"
                }
              `}
            >
              {/* Shimmer on loading */}
              {isGenerating && (
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Generating avatar…
                  </>
                ) : (
                  <>✨ Generate AI Avatar</>
                )}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Upload another photo button (after generation) ─────── */}
        {generatedUrl && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-white/40"
          >
            Click ↺ on the avatar to upload a new photo.
          </motion.p>
        )}

        {/* ── Estimated time hint ────────────────────────────────── */}
        {isGenerating && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-sky-400/70 font-mono"
          >
            AI is painting your avatar · 5–15 s
          </motion.p>
        )}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={dismissToast}
          />
        )}
      </AnimatePresence>
    </>
  );
}
