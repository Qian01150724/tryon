"use client";
import { useState, useRef } from "react";

interface UploadZoneProps {
  type: "person" | "clothing";
  label: string;
  icon: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  imagePreview?: string | null;
  isUploading?: boolean;
}

async function compressImage(file: File): Promise<File> {
  const MAX_PX = 1200;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= MAX_PX && height <= MAX_PX) {
          resolve(file);
          return;
        }
        if (width > height) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        } else {
          width = Math.round((width * MAX_PX) / height);
          height = MAX_PX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) =>
            resolve(
              blob
                ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
                : file
            ),
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function UploadZone({
  label,
  icon,
  onUpload,
  onRemove,
  imagePreview,
  isUploading = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件（JPG / PNG / WEBP）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("图片不能超过 10MB");
      return;
    }
    setError(null);
    const compressed = await compressImage(file);
    onUpload(compressed);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  };

  if (imagePreview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-green-400 bg-white shadow-md group aspect-[3/4]">
        <img src={imagePreview} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-white/90 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            替换
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          ✓ 已上传
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        tabIndex={0}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all cursor-pointer outline-none
          focus:border-[#7C5CFC] focus:bg-[#7C5CFC]/5
          ${
            isDragOver
              ? "border-[#7C5CFC] bg-[#7C5CFC]/5 scale-[1.02]"
              : "border-gray-300 hover:border-[#7C5CFC]/50 hover:bg-[#7C5CFC]/5"
          }
          aspect-[3/4] flex flex-col items-center justify-center bg-white/50
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-[#7C5CFC] border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">上传中...</span>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-3 opacity-60">{icon}</div>
            <p className="font-medium text-gray-700">{label}</p>
            <p className="text-sm text-gray-400 mt-1">点击 / 拖拽 / 粘贴</p>
            <p className="text-xs text-gray-300 mt-2">JPG / PNG / WEBP · ≤10MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-red-500 text-center px-2">{error}</p>}
    </div>
  );
}
