"use client";
import { useState, useEffect } from "react";
import { HistoryItem } from "@/lib/history";
import { HistoryPanel } from "@/components/HistoryPanel";

interface ResultDisplayProps {
  resultImage?: string | null;
  personImage?: string | null;
  isLoading: boolean;
  error?: string | null;
  onDownload: () => void;
  onRetry: () => void;
  stage?: "idle" | "queued" | "processing" | "done" | "error";
  history?: HistoryItem[];
  isHistoryOpen?: boolean;
  onHistoryToggle?: () => void;
  onHistorySelect?: (item: HistoryItem) => void;
  onHistoryDelete?: (id: string) => void;
  selectedHistoryId?: string | null;
}

const LOADING_STEPS = [
  "正在分析人物体型...",
  "正在识别服装轮廓...",
  "正在融合人物与服装...",
  "正在优化细节效果...",
  "即将完成，请稍候...",
];

const EXPECTED_MS = 40000;

export function ResultDisplay({
  resultImage,
  personImage,
  isLoading,
  error,
  onDownload,
  onRetry,
  stage = "idle",
  history = [],
  isHistoryOpen = false,
  onHistoryToggle,
  onHistorySelect,
  onHistoryDelete,
  selectedHistoryId = null,
}: ResultDisplayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setStepIndex(0);
      setProgress(0);
      return;
    }
    // 消息切换：每 2 秒
    const msgId = setInterval(() => setStepIndex((i) => (i + 1) % LOADING_STEPS.length), 2000);
    // 进度条：基于预期时长的 ease-out 曲线，最高到 90%
    const start = Date.now();
    const progressId = setInterval(() => {
      const ratio = (Date.now() - start) / EXPECTED_MS;
      setProgress(Math.min(90, Math.round(100 * (1 - Math.exp(-3 * ratio)))));
    }, 200);
    return () => {
      clearInterval(msgId);
      clearInterval(progressId);
    };
  }, [isLoading]);

  // 错误
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

  // 加载中
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gray-100 aspect-[3/4] max-h-[480px] w-full flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        <div className="text-center w-full px-8">
          <p className="text-gray-600 font-medium mb-3">{LOADING_STEPS[stepIndex]}</p>
          {/* 进度条 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{progress}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">预计 15–30 秒</p>
        </div>
      </div>
    );
  }

  // 有结果
  if (resultImage) {
    return (
      <>
        <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
          {personImage ? (
            // 前后对比滑动条
            <div
              className="relative aspect-[3/4] select-none"
              title="左右拖动对比穿前穿后"
            >
              {/* 换装结果（底层） */}
              <img
                src={resultImage}
                alt="换装效果"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 原图（上层，clip 到左侧） */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img src={personImage} alt="原始照片" className="w-full h-full object-cover" />
              </div>
              {/* 分割线 + 手柄 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 font-bold text-sm">
                  ↔
                </div>
              </div>
              {/* 标签 */}
              <span className="absolute top-2 left-3 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full pointer-events-none">
                原图
              </span>
              <span className="absolute top-2 right-3 text-xs bg-purple-500/80 text-white px-2 py-0.5 rounded-full pointer-events-none">
                换装后
              </span>
              {/* 透明 range input 控制滑块 */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
              {/* 放大按钮 */}
              <button
                onClick={() => setIsZoomed(true)}
                className="absolute bottom-2 right-2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-lg flex items-center justify-center text-base transition-colors"
                title="放大查看换装结果"
              >
                ⛶
              </button>
            </div>
          ) : (
            <img
              src={resultImage}
              alt="换装效果"
              className="w-full max-h-[480px] object-contain cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            />
          )}

          <div className="flex gap-3 p-4 justify-center border-t border-gray-100">
            <button
              onClick={onDownload}
              className="px-6 py-2 bg-purple-500 text-white rounded-full text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              ⬇️ 下载
            </button>
            <button
              onClick={history.length > 0 ? onHistoryToggle : undefined}
              disabled={history.length === 0}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                history.length > 0
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              🕐 历史记录 {history.length > 0 ? (isHistoryOpen ? '▲' : '▼') : ''}
            </button>
          </div>

          {isHistoryOpen && onHistorySelect && onHistoryDelete && (
            <HistoryPanel
              items={history}
              selectedId={selectedHistoryId}
              onSelect={onHistorySelect}
              onDelete={onHistoryDelete}
            />
          )}
        </div>

        {/* 放大弹窗 */}
        {isZoomed && (
          <div
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
            onClick={() => setIsZoomed(false)}
          >
            <img
              src={resultImage}
              alt="换装效果（放大）"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-lg transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  // 空状态
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 aspect-[3/4] max-h-[480px] w-full flex flex-col items-center justify-center">
      <span className="text-6xl opacity-30">🖼️</span>
      <p className="text-gray-400 mt-4">生成的效果将显示在这里</p>
    </div>
  );
}
