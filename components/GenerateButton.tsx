interface GenerateButtonProps {
  /** 是否就绪（两张图都已上传） */
  isReady: boolean;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 是否已有结果 */
  hasResult: boolean;
  /** 生成回调 */
  onGenerate: () => void;
  /** 重新生成回调 */
  onRegenerate: () => void;
}

/**
 * 生成换装按钮
 * 状态驱动：禁用 / 可点击 / 生成中 / 重新生成
 */
export function GenerateButton({
  isReady,
  isGenerating,
  hasResult,
  onGenerate,
  onRegenerate,
}: GenerateButtonProps) {
  // 生成中
  if (isGenerating) {
    return (
      <button
        disabled
        className="w-full sm:w-60 h-14 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
      >
        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        处理中...
      </button>
    );
  }

  // 已有结果 → 显示"重新生成"
  if (hasResult) {
    return (
      <button
        onClick={onRegenerate}
        className="w-full sm:w-auto px-8 h-14 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] font-semibold hover:bg-[#7C5CFC]/20 transition-colors"
      >
        🔄 重新生成
      </button>
    );
  }

  // 未就绪 → 禁用状态
  if (!isReady) {
    return (
      <button
        disabled
        className="w-full sm:w-60 h-14 rounded-full bg-gray-300 text-white font-semibold cursor-not-allowed"
      >
        🎨 生成换装效果
      </button>
    );
  }

  // 可点击状态（紫色渐变）
  return (
    <button
      onClick={onGenerate}
      className="w-full sm:w-60 h-14 rounded-full font-semibold text-white transition-all bg-gradient-to-r from-[#7C5CFC] to-[#F472B6] hover:shadow-lg hover:scale-105 active:scale-95"
    >
      🎨 生成换装效果
    </button>
  );
}