interface GenerateButtonProps {
  isReady: boolean;
  isGenerating: boolean;
  hasResult: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCancel?: () => void;
  label?: string;
}

export function GenerateButton({
  isReady,
  isGenerating,
  hasResult,
  onGenerate,
  onRegenerate,
  onCancel,
  label = "🎨 生成换装效果",
}: GenerateButtonProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          disabled
          className="w-full sm:w-60 h-14 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          {label}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    );
  }

  if (hasResult) {
    return (
      <button
        onClick={onRegenerate}
        className="w-full sm:w-auto px-8 h-14 rounded-full bg-purple-100 text-purple-600 font-semibold hover:bg-purple-200 transition-colors"
      >
        🔄 重新生成
      </button>
    );
  }

  return (
    <button
      onClick={onGenerate}
      disabled={!isReady}
      className={`
        w-full sm:w-60 h-14 rounded-full font-semibold text-white transition-all
        ${
          isReady
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:scale-105 active:scale-95"
            : "bg-gray-300 cursor-not-allowed"
        }
      `}
    >
      {label}
    </button>
  );
}
