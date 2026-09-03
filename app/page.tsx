"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { GenerateButton } from "@/components/GenerateButton";
import { ResultDisplay } from "@/components/ResultDisplay";

/**
 * 智能换装网页 - 主页面
 * 流程：上传人像 → 上传服装 → 点击生成 → 查看结果
 */
export default function Home() {
  // 状态管理
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 判断是否可生成：两张图都已上传
  const isReady = !!personImage && !!clothingImage;

  /**
   * 处理生成换装效果
   * v0.1: 模拟生成，v0.2 替换为真实 API 调用
   */
  const handleGenerate = async () => {
    if (!isReady) return;

    setIsGenerating(true);
    setError(null);

    try {
      // TODO: v0.2 替换为真实的 AI 换装 API 调用
      // const response = await fetch('/api/tryon', { ... });
      // const data = await response.json();
      // setResultImage(data.imageUrl);

      // v0.1 模拟生成延迟
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 模拟结果（实际项目中替换为真实图片 URL）
      setResultImage("/demo-result.png");
    } catch (err) {
      setError("生成失败，请重试");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 下载生成结果
   */
  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `换装效果_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* 上传区 - 桌面端双栏，移动端单栏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <UploadZone
            type="person"
            label="上传人物照片"
            icon="📷"
            imagePreview={personImage}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) =>
                setPersonImage(e.target?.result as string);
              reader.readAsDataURL(file);
            }}
            onRemove={() => setPersonImage(null)}
          />
          <UploadZone
            type="clothing"
            label="上传服装照片"
            icon="👕"
            imagePreview={clothingImage}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) =>
                setClothingImage(e.target?.result as string);
              reader.readAsDataURL(file);
            }}
            onRemove={() => setClothingImage(null)}
          />
        </div>

        {/* 生成按钮 - 居中 */}
        <div className="flex justify-center mb-8">
          <GenerateButton
            isReady={isReady}
            isGenerating={isGenerating}
            hasResult={!!resultImage}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
          />
        </div>

        {/* 结果展示 */}
        <div className="max-w-md mx-auto">
          <ResultDisplay
            resultImage={resultImage}
            isLoading={isGenerating}
            error={error}
            onDownload={handleDownload}
            onRetry={handleGenerate}
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