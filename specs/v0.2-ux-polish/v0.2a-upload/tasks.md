# Tasks

> 来源：specs/v0.2-ux-polish/v0.2a-upload/plan.md
> 规则：按顺序执行，未通过验证不得进入下一个 task。
> UI 类任务实施前必读：`components/UploadZone.tsx`（代码即视觉真相，无独立设计稿）

## Task #1: compressImage 函数 + handleFile 校验

- **目标**：在客户端实现图片压缩逻辑，并将格式/大小校验改为内联错误提示（不弹 alert）
- **改动文件**：
  - `components/UploadZone.tsx`
- **实现要点**：
  - 新增 `compressImage(file: File): Promise<File>` 纯函数：用 `FileReader` 读取文件 → `Image` 对象获取尺寸 → 宽或高超过 1200px 时用 Canvas 等比缩放 → `canvas.toBlob(..., "image/jpeg", 0.85)` 输出新 File
  - `handleFile()` 中：先做格式校验（非 `image/*` → `setError("请上传图片文件（JPG / PNG / WEBP）")`），再做大小校验（> 10MB → `setError("图片不能超过 10MB")`），校验通过后调 `compressImage()` 再 `onUpload()`
  - 成功路径开头 `setError(null)` 清除上一次错误
  - 添加 `error` state（`useState<string | null>(null)`），在上传区容器外下方渲染 `<p className="text-xs text-red-500 text-center px-2">{error}</p>`
- **视觉参考**：
  - 错误状态：上传区下方出现红色小字，不弹窗（在浏览器中拖入非图片文件验证）
  - 已上传状态：绿色边框 + "✓ 已上传" 徽章（见 `UploadZone.tsx` `imagePreview` 分支）
- **验证**：
  - 命令：`pnpm dev`，打开 http://localhost:3000
  - 拖入 `.pdf` 文件 → 上传区下方出现"请上传图片文件"红字，页面无弹窗
  - 拖入 > 10MB 图片 → 出现"图片不能超过 10MB"红字
  - 上传宽度 > 1200px 的图片（如 3000px 截图） → 打开 DevTools Network，查看 POST /api/tryon 请求体中 personImage base64 解码后图片尺寸应 ≤ 1200px
  - 上传成功后错误文字自动消失
- **对应**：plan §2 / FR-002, FR-003, SC-002, SC-003, SC-005

---

## Task #2: 粘贴上传 + 键盘可访问性

- **目标**：让上传区支持 Ctrl+V 粘贴图片，并通过键盘完整操作上传
- **改动文件**：
  - `components/UploadZone.tsx`
- **实现要点**：
  - 粘贴：在上传区 div 上绑定 `onPaste` 事件，`handlePaste(e: React.ClipboardEvent)` 遍历 `e.clipboardData.items`，找到第一个 `item.type.startsWith("image/")` 的条目，`item.getAsFile()` 后传入 `handleFile()`
  - 键盘：上传区 div 设置 `tabIndex={0}`，`onKeyDown` 捕获 `e.key === "Enter" || e.key === " "` 时调用 `inputRef.current?.click()`
  - focus 样式：添加 Tailwind `focus:border-[#7C5CFC] focus:bg-[#7C5CFC]/5 outline-none` 确保聚焦可见
- **视觉参考**：
  - 键盘聚焦：上传区出现紫色 focus ring（`#7C5CFC` 边框 + 淡紫背景）
  - 粘贴后：与点击上传结果一致，显示图片预览
- **验证**：
  - 命令：`pnpm dev`，打开 http://localhost:3000
  - 截图（系统截图工具）→ 点击上传区使其聚焦 → Ctrl+V → 上传区显示图片预览
  - 截图粘贴后结果与直接拖拽上传同一张图效果一致
  - Tab 键定位到上传区 → 出现紫色 focus ring → 按 Enter → 弹出文件选择器
  - 按 Space → 同样弹出文件选择器
  - 文件选择器中选图片 → 预览正常显示
- **对应**：plan §2 / FR-001, FR-004, SC-001, SC-004
