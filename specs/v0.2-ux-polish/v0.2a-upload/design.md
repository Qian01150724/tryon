# Design: v0.2a 上传体验优化

> 入口：本文件是 plan 阶段的设计上下文。
> 来源：specs/v0.2-ux-polish/v0.2a-upload/spec.md（无 design/ 产物；实现已落地于 `components/UploadZone.tsx`，代码即设计真相）

⚠️ **design/ 目录不存在**。本功能已在代码中完整实现，视觉 ground truth 为 `components/UploadZone.tsx`，无单独设计稿。如需补充截图，可将运行中页面截图放入 `design/screenshots/` 后重跑 `/design`。

## 1. 产品概述

上传区是 AI 换装工具的核心入口，支持点击选图、拖拽、粘贴三种上传方式，并在客户端完成大图压缩和格式/大小校验。v0.2a 在 v0.1 基础上新增粘贴上传、1200px 压缩、内联错误提示与键盘可访问性。

## 2. 页面 / 模块清单

### M1. UploadZone 组件（`components/UploadZone.tsx`）

- **视觉 ground truth**：_(待出稿后回填；可截运行页面补充 `design/screenshots/`)_
- **原型代码**：`components/UploadZone.tsx`（已实现，直接阅读）
- **用途**：接受用户图片输入，校验格式与大小，压缩后通过 `onUpload(file)` 回调传出
- **用户角色**：所有访问换装工具的用户
- **数据模型**：
  - Props: `{ type, label, icon, onUpload: (file: File) => void, onRemove: () => void, imagePreview?: string | null, isUploading?: boolean }`
  - 内部状态: `isDragOver: boolean`, `error: string | null`
- **核心功能 / 交互**：
  - 粘贴上传：`onPaste` → 提取 image/* → `handleFile()`（关联 FR-001）
  - 大图压缩：`compressImage()` Canvas 等比缩放至 ≤1200px，JPEG 0.85 输出（关联 FR-002）
  - 内联错误：`error` state 渲染在上传区下方红色文字（关联 FR-003）
  - 键盘操作：`tabIndex=0`，Enter/Space 触发 `<input>` click，focus ring 样式（关联 FR-004）
- **布局要点**：上传区为 aspect-[3/4] 竖版卡片；错误文本在卡片外下方独立行；已上传状态切换为预览图+悬浮操作层
- **关联 FR**：FR-001, FR-002, FR-003, FR-004

## 3. 全局约束 & 设计 token

### 3.1 通用约束
- 响应式：移动端单列，桌面端双列（由 `page.tsx` grid 控制）
- 无 constitution.md，无全局强制规范

### 3.2 设计 token（从 `UploadZone.tsx` 内联样式提取）

| Token / 值 | 用途 |
|---|---|
| `#7C5CFC` | 主色：focus ring、拖拽 hover、边框高亮 |
| `border-gray-300` | 默认上传区边框 |
| `border-green-400` | 已上传状态边框 |
| `bg-green-500` | 已上传徽章背景 |
| `text-red-500 text-xs` | 内联错误文字样式 |
| `aspect-[3/4]` | 上传区宽高比 |

## 4. 设计产物索引

### 4.1 系统级产物
- **实现文件**：`components/UploadZone.tsx`（视觉与交互真相）
- OVERVIEW / DESIGN_NOTES / tokens.css / screenshots：_(待填，如需补充)_

### 4.2 每页产物映射

| 模块 | 截图 | 代码 | 关联 FR |
|---|---|---|---|
| M1. UploadZone | _(待补充)_ | `components/UploadZone.tsx` | FR-001~004 |

## 5. 关键设计决策

- **粘贴范围**：`onPaste` 绑定在上传区 div，不做全局监听（Q1 答复 A）
- **压缩格式**：统一输出 JPEG 0.85，接受透明通道丢失取舍（Q2 答复 A）
- **quality 硬编码**：0.85 不通过 props 暴露（Q3 答复 A）
- **文件名**：压缩后依赖浏览器原始 name，不做额外处理（Q4 答复 A）
- **已上传态**：与上传态完全不同的渲染分支（`if imagePreview return`），悬浮显示"替换"按钮

## 6. 设计阶段发现的 spec 缺口

- 无。代码实现与 spec 完全对齐，clarify 所有问题均已答复。

## 7. Design 产出

| 模块 | 产物路径 | 状态 |
|------|---------|------|
| M1. UploadZone | `components/UploadZone.tsx` | ✅ 已实现 |

---

## 8. 开发注意事项

> ⚠️ **本功能已完整实现，此节为 plan/tasks 阶段参考。**

### 8.1 代码即真相
本 spec 无独立设计稿，`components/UploadZone.tsx` 同时是实现和视觉参考。如需对照验证，直接运行 `pnpm dev` 打开页面操作上传区。

### 8.2 验证路径
1. 粘贴验证：截图 → Ctrl+V 粘贴到上传区（需先 Tab 聚焦或点击区域）
2. 压缩验证：上传 >1200px 图，用 DevTools Network 检查发出的 base64 对应尺寸
3. 错误验证：拖入非图片文件，确认下方红字出现、无 alert 弹窗
4. 键盘验证：Tab 到上传区 → Enter → 文件选择器弹出

### 8.3 对照自检
已实现，无需对照；如做改动，对比 `UploadZone.tsx` 原有逻辑确认无回归。
