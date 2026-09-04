import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // 直接返回一张固定的示例图片，不调用任何 API
  // 图片放在 public 目录下，比如 public/demo-result.png

  // 如果你有一张示例图片，用这个：
  const demoImageUrl = "/demo-result.png";

  // 或者用网上的一张示例图：
  // const demoImageUrl = "https://picsum.photos/seed/1/400/500";

  // 模拟延迟，让用户感觉在生成
  await new Promise((resolve) => setTimeout(resolve, 8000));

  return NextResponse.json({
    resultImage: demoImageUrl,
  });
}