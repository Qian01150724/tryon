# Spec: v0.2a 上传体验优化

## 1. 背景与目标

v0.1 的上传区已支持点击选图与拖拽，但缺少粘贴、图片压缩、键盘可访问性与内联错误提示。v0.2a 目标是让上传区对所有输入方式友好，并在客户端提前处理图片体积，减少后端压力与等待感。

## 2. 用户故事 / 使用场景

- **截图粘贴**：用户截屏后直接 Ctrl+V 粘贴进上传区，无需保存成文件再上传
- **大图自动压缩**：用户上传 4K 照片，上传区自动压缩到 1200px 以内，不感知延迟
- **错误内联提示**：用户拖入非图片文件或超过 10MB，上传区下方出现红色文字提示，不打断操作流
- **键盘操作**：键盘用户 Tab 聚焦上传区后，按 Enter 或 Space 打开文件选择器

## 3. 功能需求 (FR)

| 编号 | 需求 | 验证方式 |
|------|------|---------|
| FR-001 | 上传区监听 `onPaste` 事件，从 ClipboardData 提取 image/* 类型的文件并触发上传流程 | Ctrl+V 粘贴截图后显示预览 |
| FR-002 | 上传前检测图片宽或高是否超过 1200px；超过则用 Canvas 等比缩放至 1200px 以内，以 JPEG 0.85 质量输出新 File | 上传 2000px 图片后，发送到 API 的 base64 对应的图片尺寸 ≤ 1200px |
| FR-003 | 格式校验（非 image/*）和大小校验（> 10MB）失败时，在上传区下方显示内联错误文本，不调用 `window.alert` | 拖入 .pdf 文件后显示"请上传图片文件"红色文字，无弹窗 |
| FR-004 | 上传区容器设置 `tabIndex={0}`，`onKeyDown` 捕获 Enter / Space 键后触发 `<input type="file">` 的点击事件；聚焦时显示 focus ring 样式 | Tab 到上传区后按 Enter 弹出文件选择器 |

## 4. 成功标准 (SC)

| 编号 | 标准 |
|------|------|
| SC-001 | 粘贴截图（含系统截图工具生成的图片）后，上传区显示预览图，与点击上传结果一致 |
| SC-002 | 上传宽度 > 1200px 的图片时，`compressImage()` 返回的 File 对应图片宽高均 ≤ 1200px |
| SC-003 | 上传非图片文件或超大文件，页面无 `alert()` 弹窗，上传区下方出现红色错误文本 |
| SC-004 | 纯键盘操作可完成完整上传流程：Tab 聚焦 → Enter/Space 打开选择器 → 选择文件 → 预览显示 |
| SC-005 | 上传成功后错误文本自动清除（`setError(null)`） |

## 5. 范围与边界

**In Scope**
- `components/UploadZone.tsx` 的粘贴、压缩、内联错误、键盘交互逻辑
- `compressImage()` 客户端压缩函数（Canvas + FileReader）

**Out of Scope**
- 服务端图片处理（压缩在客户端完成）
- 上传进度条（属于 v0.2b 等待体验范畴）
- 多文件批量上传（v0.1/v0.2 均为单文件）
- 图片格式转换（压缩统一输出 JPEG，不提供格式选项）

## 6. 依赖与约束

- 依赖浏览器原生 API：`ClipboardEvent`、`Canvas 2D Context`、`FileReader`、`HTMLInputElement.click()`
- 压缩逻辑在 `handleFile()` 中同步调用 `compressImage()`，为 async；上传区点击/拖拽/粘贴三条路径均经过同一个 `handleFile`
- `page.tsx` 通过 `onUpload(file)` 回调接收压缩后的 File，用 `FileReader.readAsDataURL` 转 base64；上传区不持有 base64，职责分离

## 7. 待澄清事项

无。所有功能点已在 `components/UploadZone.tsx` 中完整实现，brief 与代码一致。
