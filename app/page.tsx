"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { GenerateButton } from "@/components/GenerateButton";
import { ResultDisplay } from "@/components/ResultDisplay";

type Stage = "idle" | "queued" | "processing" | "done" | "error";

const TIMEOUT_MS = 30_000;

export default function Home() {
  const [personImage, setPersonImage] = useState<{ file: File; preview: string } | null>(null);
  const [clothingImage, setClothingImage] = useState<{ file: File; preview: string } | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timedOutRef = useRef(false);

  const isReady = !!personImage && !!clothingImage;
  const isGenerating = stage === "queued" || stage === "processing";

  const handleGenerate = async () => {
    if (!isReady) return;

    // 取消上一次未完成的请求
    abortRef.current?.abort();
    timedOutRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    setStage("queued");
    setError(null);
    setResultImage(null);

    const timeoutId = setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
    }, TIMEOUT_MS);

    try {
      const personBase64 = personImage.preview.split(",")[1];
      const clothingBase64 = clothingImage.preview.split(",")[1];

      setStage("processing");

      const response = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personImage: personBase64, clothingImage: clothingBase64 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || data.error) throw new Error(data.error || "生成失败");

      setResultImage(data.resultImage);
      setStage("done");
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        if (timedOutRef.current) {
          setError("生成超时（超过 30 秒），请重试");
          setStage("error");
        }
        // 用户主动取消时 stage 已由 handleCancel 重置
      } else {
        setError(err instanceof Error ? err.message : "生成失败，请重试");
        setStage("error");
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStage("idle");
    setError(null);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `换装效果_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setResultImage(null);
    setStage("idle");
    setError(null);
  };

  const getButtonLabel = () => {
    switch (stage) {
      case "queued":
        return "⏳ 排队中...";
      case "processing":
        return "🔄 处理中...";
      default:
        return "🎨 生成换装效果";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* 上传区 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <UploadZone
            type="person"
            label="上传人物照片"
            icon="📷"
            imagePreview={personImage?.preview || null}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                setPersonImage({ file, preview: e.target?.result as string });
              };
              reader.readAsDataURL(file);
            }}
            onRemove={() => {
              setPersonImage(null);
              handleReset();
            }}
          />
          <UploadZone
            type="clothing"
            label="上传服装照片"
            icon="👕"
            imagePreview={clothingImage?.preview || null}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                setClothingImage({ file, preview: e.target?.result as string });
              };
              reader.readAsDataURL(file);
            }}
            onRemove={() => {
              setClothingImage(null);
              handleReset();
            }}
          />
        </div>

        {/* 生成按钮 */}
        <div className="flex justify-center mb-8">
          <GenerateButton
            isReady={isReady}
            isGenerating={isGenerating}
            hasResult={stage === "done"}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
            onCancel={handleCancel}
            label={getButtonLabel()}
          />
        </div>

        {/* 结果展示 */}
        <div className="max-w-md mx-auto">
          <ResultDisplay
            resultImage={resultImage}
            personImage={personImage?.preview || null}
            isLoading={isGenerating}
            error={error}
            onDownload={handleDownload}
            onRetry={handleGenerate}
            stage={stage}
          />
        </div>

        {/* 隐私声明 */}
        <div className="text-center text-xs text-gray-400 mt-8">
          🔒 图片仅用于本次生成，处理完成后自动删除 · 不存储任何用户数据
        </div>
      </main>
    </div>
  );
}
