import { useState, useRef } from "react";

interface UploadZoneProps {
  /** 上传类型：人物或服装 */
  type: "person" | "clothing";
  /** 显示标签 */
  label: string;
  /** 显示图标（emoji） */
  icon: string;
  /** 上传成功回调 */
  onUpload: (file: File) => void;
  /** 移除图片回调 */
  onRemove: () => void;
  /** 图片预览 URL */
  imagePreview?: string | null;
  /** 是否正在上传 */
  isUploading?: boolean;
}

/**
 * 通用上传区域组件
 * 支持点击选择和拖拽上传
 * 状态：空状态 / 上传中 / 已上传
 */
export function UploadZone({
  type,
  label,
  icon,
  onUpload,
  onRemove,
  imagePreview,
  isUploading = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择
   * 校验格式和大小
   */
  const handleFile = (file: File) => {
    // 校验图片格式
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }
    // 校验文件大小 ≤ 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("图片大小不能超过 10MB");
      return;
    }
    onUpload(file);
  };

  // ===== 已上传状态：显示缩略图 =====
  if (imagePreview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-green-400 bg-white shadow-md group aspect-[3/4]">
        <img
          src={imagePreview}
          alt={label}
          className="w-full h-full object-cover"
        />
        {/* 悬停时显示替换按钮 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-white/90 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            替换
          </button>
        </div>
        {/* 已上传标识 */}
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          ✓ 已上传
        </div>
      </div>
    );
  }

  // ===== 空状态 / 上传中：显示上传区域 =====
  return (
    <div
      className={`
        relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
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
    >
      {isUploading ? (
        // 上传中
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#7C5CFC] border-t-transparent animate-spin" />
          <span className="text-sm text-gray-500">上传中...</span>
        </div>
      ) : (
        // 空状态
        <>
          <div className="text-5xl mb-3 opacity-60">{icon}</div>
          <p className="font-medium text-gray-700">{label}</p>
          <p className="text-sm text-gray-400 mt-1">点击或拖拽上传</p>
          <p className="text-xs text-gray-300 mt-2">JPG / PNG / WEBP · ≤10MB</p>
        </>
      )}
      {/* 隐藏的 file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // 重置 input，允许重复选择同一文件
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}