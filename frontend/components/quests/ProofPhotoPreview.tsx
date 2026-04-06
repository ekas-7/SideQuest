"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

export function ProofPhotoPreview({
  file,
  variant = "default",
}: {
  file: File | null;
  variant?: "default" | "cinematic";
}) {
  const objectUrl = useMemo(() => {
    if (!file) {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "max-w-md overflow-hidden rounded-xl",
        variant === "cinematic"
          ? "border border-white/10 bg-black/30"
          : "sq-media-frame bg-background/20"
      )}
    >
      {/* Blob preview — not compatible with next/image without a custom loader */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={objectUrl}
        alt="Selected proof"
        className="max-h-48 w-full object-contain"
      />
    </div>
  );
}
