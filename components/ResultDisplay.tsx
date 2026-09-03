interface ResultDisplayProps {
  /** 生成结果图片 URL */
  resultImage?: string | null;
  /** 是否加载中 */
  isLoading: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 下载回调 */
  onDownload: () => void;
  /** 重试回调 */
  onRetry: () => void;
}

/**
 * 结果展示组件
 * 状态：空状态 / 加载中 / 成功 / 错误
 */
export function ResultDisplay({
  resultImage,
  isLoading,
  error,
  onDownload,
  onRetry,
}: ResultDisplayProps) {
  // ===== 错误状态 =====
  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-8 text-center">
        <p className="text-red-500 font-medium">😅 生成失败了</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // ===== 加载中 =====
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gray-100 aspect-[3/4] max-h-[480px] w-full animate-pulse flex items-center justify-center">
        <div className="text-gray-400">⏳ 生成中...</div>
      </div>
    );
  }

  // ===== 成功：显示结果 =====
  if (resultImage) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
        <img
          src={resultImage}
          alt="换装效果"
          className="w-full max-h-[480px] object-contain"
        />
        <div className="flex gap-3 p-4 justify-center border-t border-gray-100">
          <button
            onClick={onDownload}
            className="px-6 py-2 bg-[#7C5CFC] text-white rounded-full text-sm font-medium hover:bg-[#5B3EC9] transition-colors"
          >
            ⬇️ 下载
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            🔄 重新生成
          </button>
        </div>
      </div>
    );
  }

  // ===== 空状态 =====
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 aspect-[3/4] max-h-[480px] w-full flex flex-col items-center justify-center">
      <span className="text-6xl opacity-30">🖼️</span>
      <p className="text-gray-400 mt-4">生成的效果将显示在这里</p>
    </div>
  );
}