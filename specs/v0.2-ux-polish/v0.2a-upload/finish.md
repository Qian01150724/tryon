# Finish: v0.2a 上传体验优化 — Round 1

> 本文件是 Round 1 完成后的状态快照，作为下一轮 /specify 的基线。
> 生成时间：2026-09-04
> 上一轮：无（首轮）

## 1. 本轮做了什么（一句话）

在 `components/UploadZone.tsx` 单文件内为上传区新增粘贴上传、1200px Canvas 压缩、内联错误提示、键盘可访问性四项能力，全部为客户端实现，不涉及服务端改动。

## 2. 已落地能力清单（FR 维度）

- **FR-001 粘贴上传**：`onPaste` 绑定在上传区 div，仅上传区聚焦时响应；从 `ClipboardEvent.clipboardData.items` 提取 image/* → `handleFile()` → `onUpload()` → 文件 `components/UploadZone.tsx`
- **FR-002 Canvas 压缩**：`compressImage(file)` 纯函数；宽或高 > 1200px 时 Canvas 等比缩放，`toBlob(..., "image/jpeg", 0.85)` 输出，有 null fallback → 文件 `components/UploadZone.tsx`
- **FR-003 内联错误**：`error: string | null` state，校验失败时 `setError()` 渲染红字，不调 `window.alert`；成功上传时 `setError(null)` 清除 → 文件 `components/UploadZone.tsx`
- **FR-004 键盘操作**：`tabIndex={0}`，`onKeyDown` 捕获 Enter/Space 触发 `input.click()`，`focus:border-[#7C5CFC] focus:bg-[#7C5CFC]/5 outline-none` 提供 focus ring → 文件 `components/UploadZone.tsx`

## 3. 已落地的数据 / 接口 / 配置

- **数据表**：无（纯客户端）
- **接口 / 函数**：
  - `compressImage(file: File): Promise<File>`：宽或高 > 1200px 时 JPEG 0.85 压缩，否则原样返回
  - `UploadZoneProps.onUpload(file: File)`：接收压缩后 File，接口签名未变
- **配置 / 环境变量**：无（压缩阈值 1200px、quality 0.85 均 hardcode，clarify 确认不需可配置）

## 4. 影响的目录 / 模块

- `components/UploadZone.tsx`：新增 `compressImage()`、`handlePaste()`，修改 `handleFile()`（加校验和 error state），修改 JSX（加 `tabIndex`、`onKeyDown`、错误文本渲染）
- 其他文件：无改动（`app/page.tsx` `onUpload` 接口不变，服务端不感知）

## 5. 与上一轮 finish.md 的差异

首轮，无差异基线。

## 6. 遗留 / 已知问题

- **Safari 粘贴行为**：`handlePaste` 依赖上传区聚焦，Safari 下粘贴前需先点击区域；已接受（clarify Q1 答复 A，不做全局监听）
- **透明通道丢失**：PNG 压缩后统一输出 JPEG，透明背景变不透明；已接受（clarify Q2 答复 A，换装场景照片无透明通道需求）
- **主线程压缩阻塞**：4K 图压缩约 100-300ms 阻塞 UI；当前规模可接受，未做 Web Worker 优化 → 可继续观察

## 7. 下一轮启动建议

- 上传体验四项能力已全部落地，下一轮不要重定义 FR-001~004
- 如需优化：可考虑 Web Worker 压缩（解决主线程阻塞）或全局粘贴监听（更宽松的粘贴触发条件），作为新增量写入 brief.md
