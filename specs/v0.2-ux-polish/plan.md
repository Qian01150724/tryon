# 智能换装网页 - 技术方案 v0.2

## 版本说明
**版本**：v0.2
**对应功能**：上传体验优化 + 等待体验优化 + 结果体验优化
**技术决策依据**：intent.md（极简操作、隐私安全）+ spec.md v0.2（三段体验打磨）
**上一版本**：v0.1（核心交互闭环）

---

## 技术栈

### 核心框架
- **Next.js**（App Router）
- **TypeScript**
- **Tailwind CSS**

### 状态管理
- `React useState`：图片状态、生成阶段、错误信息、进度
- `React useRef`：AbortController 引用、超时标记
- `React useEffect`：进度条定时器、提示语轮换定时器

### 浏览器 API
- **Canvas API**：客户端图片压缩（UploadZone 内部，无外部依赖）
- **Clipboard API**：粘贴上传，通过 `onPaste` 事件读取 `clipboardData.items`
- **AbortController**：取消 fetch 请求

### 部署平台
- **Vercel**（CI/CD，环境变量管理）

---

## 组件设计

### 1. UploadZone

**v0.2 新增能力**：
- 粘贴上传（`tabIndex={0}` + `onPaste` 事件）
- 上传前自动压缩（内置 `compressImage`，基于 Canvas，超过 1200px 才压缩）
- 内联错误状态（替代 `alert()`，组件内维护 `error` state）
- 支持键盘操作（`onKeyDown` Enter/Space 触发文件选择）

```typescript
interface UploadZoneProps {
  type: "person" | "clothing"
  label: string
  icon: string
  onUpload: (file: File) => void
  onRemove: () => void
  imagePreview?: string | null
  isUploading?: boolean
}
```

**压缩策略**：
- 触发条件：宽或高超过 1200px
- 输出格式：`image/jpeg`，质量 0.85
- 未超过阈值则直接透传原文件，不做任何处理

### 2. GenerateButton

**v0.2 新增能力**：
- 生成中显示"取消"文字按钮（`onCancel` prop 可选）

```typescript
interface GenerateButtonProps {
  isReady: boolean
  isGenerating: boolean
  hasResult: boolean
  onGenerate: () => void
  onRegenerate: () => void
  onCancel?: () => void   // 新增
  label?: string
}
```

### 3. ResultDisplay

**v0.2 新增能力**：
- 动态分步提示语（`useEffect` + `setInterval`，每 2 秒切换）
- 进度条（ease-out 曲线，最高 90%，避免假完成）
- 前后对比滑动条（`clip-path: inset()` 裁切原图，透明 `range input` 控制）
- 放大弹窗（`fixed` 全屏遮罩 + 原图展示）

```typescript
interface ResultDisplayProps {
  resultImage?: string | null
  personImage?: string | null   // 新增，用于对比滑动条
  isLoading: boolean
  error?: string | null
  onDownload: () => void
  onRetry: () => void
  stage?: "idle" | "queued" | "processing" | "done" | "error"
}
```

**进度条实现**：
```
progress = min(90, round(100 × (1 - e^(-3 × elapsed/EXPECTED_MS))))
```
每 200ms 更新一次，`EXPECTED_MS = 8000`，停在 90% 等待真实完成。

**对比滑动条实现**：
- 换装结果图作为底层，绝对定位铺满容器
- 原图通过 `clipPath: inset(0 ${100-sliderPos}% 0 0)` 裁切到左侧
- 透明的 `<input type="range">` 铺满容器，接管拖动交互
- 分割线和手柄为 `pointer-events-none`，不干扰 range 输入

### 4. page.tsx（主页面）

**v0.2 新增逻辑**：
- `AbortController` 管理请求取消
- `timedOutRef` 区分"用户主动取消"和"30 秒超时"两种中止
- 将 `personImage?.preview` 传递给 `ResultDisplay` 用于对比

**生成流程**：
```
handleGenerate()
  ├─ 新建 AbortController，清除上一次
  ├─ 设置 30s setTimeout → 超时后 controller.abort()
  ├─ setStage("queued") → setStage("processing")
  ├─ fetch("/api/tryon", { signal })
  ├─ 成功 → setResultImage + setStage("done")
  └─ AbortError
       ├─ timedOut → setError("超时") + setStage("error")
       └─ 用户取消 → stage 已由 handleCancel 重置为 "idle"

handleCancel()
  └─ controller.abort() + setStage("idle") + setError(null)
```

### 5. API 路由（mock）

`app/api/tryon/route.ts`：延迟 8 秒后返回固定示例图，模拟真实 AI 接口的等待时长，方便演示等待体验。

---

## 品牌与视觉

与 v0.1 保持一致（见 v0.1 plan.md），v0.2 新增：
- 进度条：渐变色 `from-purple-500 to-pink-500`，与主按钮一致
- 对比滑动条手柄：白色圆形，带阴影，内含 `↔` 符号
- 放大弹窗背景：`bg-black/85`

---

## 部署方案

Vercel，连接 GitHub 仓库，自动构建。v0.3 接入真实 AI API 时需配置环境变量。

---

## 验收对照

| spec.md 验收项 | 对应实现 |
|---|---|
| 上传区支持粘贴 | UploadZone `onPaste` 读取 clipboardData |
| 超过 1200px 自动压缩 | UploadZone 内 `compressImage`（Canvas） |
| 格式/大小错误内联提示 | UploadZone `error` state，不 alert |
| 分步提示语每 2 秒切换 | ResultDisplay `useEffect + setInterval` |
| 进度条 ease-out 曲线 | ResultDisplay `setInterval` 200ms 更新 |
| 30 秒超时自动中止 | page.tsx `setTimeout + AbortController` |
| 生成中可取消 | GenerateButton `onCancel` + page `handleCancel` |
| 前后对比滑动条 | ResultDisplay `clip-path + range input` |
| 结果图可放大查看 | ResultDisplay `fixed` 全屏弹窗 |
| 键盘可操作上传区 | UploadZone `tabIndex + onKeyDown` |
