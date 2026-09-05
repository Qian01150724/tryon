# 技术方案合集

> 所有版本的技术方案按版本顺序汇总。每轮 `/finish` 后追加新版本章节。
> 项目原则约束：见 `docs/intent.md`（隐私、极简、无需登录、不做社交/视频/3D）。
> 所有技术决策不得违反 intent.md 的非目标清单。

---

## v0.1 — 核心交互闭环

> **本版变更**：从零建立，无上一版基线。
> 新增：技术栈、目录结构、核心状态模型、mock API 路由。
> 上一版基线：无

**技术栈**：Next.js App Router + TypeScript + Tailwind CSS，部署在 Vercel。

**目录结构**：
```
app/
  page.tsx              主页面，管理所有状态
  layout.tsx
  api/tryon/route.ts    mock 路由，延迟返回示例图
components/
  Header.tsx
  UploadZone.tsx        点击/拖拽上传
  GenerateButton.tsx    四态按钮
  ResultDisplay.tsx     基础结果展示
```

**核心 State（page.tsx）**：
```ts
personImage / clothingImage  // { file: File; preview: string } | null
resultImage                  // string | null
stage                        // "idle" | "queued" | "processing" | "done" | "error"
error                        // string | null
```

---

## v0.2a — 上传体验优化

> **本版变更**：在 v0.1 基础上，`UploadZone.tsx` 新增 `compressImage`、`handlePaste`、`error` state、键盘支持。其他文件无改动。
> 新增接口：`compressImage(file): Promise<File>`。
> 上一版基线：v0.1

**改动范围**：`components/UploadZone.tsx`（单文件，无服务端改动，无新依赖）

**内部结构**：
```
UploadZone.tsx
  ├── compressImage()    Canvas 等比压缩，>1200px 才触发，输出 JPEG 0.85
  ├── handleFile()       统一校验 + 压缩入口（点击/拖拽/粘贴三路径共用）
  ├── handlePaste()      ClipboardEvent 处理，仅提取 image/* 类型
  └── JSX                tabIndex={0} / onKeyDown / error 内联渲染
```

**接口契约**：

`compressImage(file: File): Promise<File>`
- 宽或高 ≤ 1200px：原样返回
- 超过：Canvas 等比缩放 → `toBlob` JPEG 0.85 → 构造新 File（扩展名 `.jpg`）

`UploadZoneProps`：
```ts
interface UploadZoneProps {
  type: "person" | "clothing";
  label: string;
  icon: string;
  onUpload: (file: File) => void;  // 接收压缩后的 File
  onRemove: () => void;
  imagePreview?: string | null;
  isUploading?: boolean;
}
```

**内联错误触发条件**：
| 条件 | 错误文本 |
|------|---------|
| `!file.type.startsWith("image/")` | `"请上传图片文件（JPG / PNG / WEBP）"` |
| `file.size > 10 * 1024 * 1024` | `"图片不能超过 10MB"` |

**新增组件内 State**：
| State | 类型 | 用途 |
|-------|------|------|
| `isDragOver` | `boolean` | 拖拽高亮样式 |
| `error` | `string \| null` | 内联错误文本，null 时不渲染 |

---

## v0.2b — 等待体验优化

> **本版变更**：在 v0.2a 基础上，`ResultDisplay.tsx` 的 `EXPECTED_MS` 从 8000 改为 40000，新增 `{progress}%` 数字显示。`GenerateButton.tsx`、`page.tsx` 的取消/超时逻辑为 v0.1 已有功能，本轮补文档，无代码改动。
> 上一版基线：v0.2a

**改动范围**：`components/ResultDisplay.tsx`（改 1 个常量 + 加 1 行 JSX）

**关键常量变更**：
```ts
// v0.1/v0.2a: EXPECTED_MS = 8000
// v0.2b 改为：
const EXPECTED_MS = 40000;  // 使进度曲线在 30s 窗口内平缓增长，不冻结
```

**进度公式**：
```ts
// 每 200ms 更新
const ratio = (Date.now() - start) / EXPECTED_MS;
setProgress(Math.min(90, Math.round(100 * (1 - Math.exp(-3 * ratio)))));
// 40s 基准下，30s 时约达 89%，整个窗口持续增长
```

**ResultDisplay 内部 State**（本版新增）：
| State | 类型 | 用途 |
|-------|------|------|
| `stepIndex` | `number` | 当前提示语索引（5 条循环） |
| `progress` | `number` | 进度百分比 0–90 |

**page.tsx 已有逻辑（文档补齐）**：
```ts
// 取消/超时控制
abortRef: MutableRefObject<AbortController | null>  // 控制请求取消
timedOutRef: MutableRefObject<boolean>              // 区分超时 vs 用户取消
TIMEOUT_MS = 30_000                                 // 超时阈值
```

---

## v0.2c — 结果体验优化

> **本版变更**：在 v0.2b 基础上，`ResultDisplay.tsx` 有结果分支新增对比滑动条和放大弹窗。代码已在 v0.1 实现，本轮为文档补齐，无代码改动。
> 新增 State：`sliderPos`、`isZoomed`。
> 上一版基线：v0.2b

**改动范围**：`components/ResultDisplay.tsx` 有结果分支（无新代码改动）

**新增组件内 State**：
| State | 类型 | 初始值 | 用途 |
|-------|------|--------|------|
| `sliderPos` | `number` | 50 | 对比滑动条分割线位置（0–100） |
| `isZoomed` | `boolean` | false | 全屏放大弹窗开关 |

**对比滑动条实现**：
```ts
// 换装结果图：底层，absolute inset-0 铺满
// 原图：上层，clip 到左侧 sliderPos%
clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
// 分割线位置
style={{ left: `${sliderPos}%` }}
// 透明 range input 铺满容器接管拖动，分割线/手柄 pointer-events-none
```

**放大弹窗**：`fixed inset-0 z-50 bg-black/85`，两处关闭路径（遮罩 / ✕ 按钮）均调用 `setIsZoomed(false)`。

**ResultDisplayProps**（v0.2c 最终状态）：
```ts
interface ResultDisplayProps {
  resultImage?: string | null;
  personImage?: string | null;  // 对比滑动条原图侧
  isLoading: boolean;
  error?: string | null;
  onDownload: () => void;
  onRetry: () => void;
  stage?: "idle" | "queued" | "processing" | "done" | "error";
}
```

---

## v0.3a — 客户端历史记录

> **本版变更**：在 v0.2c 基础上，新增历史记录功能。
> 新增文件：`lib/history.ts`（4 个导出函数 + 1 个接口）、`components/HistoryPanel.tsx`。
> 改动文件：`components/ResultDisplay.tsx`（底部按钮替换 + 新增 6 个 props）、`app/page.tsx`（新增 3 个 state + 3 个回调）。
> 上一版基线：v0.2c

**改动范围**：
```
lib/
  history.ts                ← 新建
components/
  HistoryPanel.tsx          ← 新建
  ResultDisplay.tsx         ← 修改：底部按钮 + 6 个新 props
app/
  page.tsx                  ← 修改：3 个新 state + 3 个新回调 + props 透传
```

**数据模型**：
```ts
interface HistoryItem {
  id: string;        // String(Date.now())
  timestamp: number; // Unix ms
  thumbnail: string; // base64，120px 宽 JPEG 0.85
}
// localStorage key: 'tryon_history'，上限 10 条
```

**常量（`lib/history.ts` 顶部）**：
```ts
const HISTORY_KEY = 'tryon_history';
const HISTORY_MAX = 10;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_QUALITY = 0.85;
```

**接口契约（`lib/history.ts` 导出）**：
| 函数 | 签名 | 说明 |
|------|------|------|
| `loadHistory` | `(): HistoryItem[]` | 读取 localStorage，解析失败清空 key 返回 `[]` |
| `addHistoryItem` | `(resultImage, current): Promise<HistoryItem[]>` | Canvas 生成缩略图 → 追加 → slice(-10) → 写入；异常静默返回原数组 |
| `deleteHistoryItem` | `(id, current): HistoryItem[]` | filter → 写入 → 返回新数组 |
| `formatRelativeTime` | `(timestamp): string` | 刚刚 / N 分钟前 / N 小时前 / N 天前 |

**HistoryPanel Props（新建组件）**：
```ts
interface HistoryPanelProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}
```

**ResultDisplayProps 新增部分（v0.3a 追加，在 v0.2c 基础上）**：
```ts
history?: HistoryItem[];           // default []
isHistoryOpen?: boolean;           // default false
onHistoryToggle?: () => void;
onHistorySelect?: (item: HistoryItem) => void;
onHistoryDelete?: (id: string) => void;
selectedHistoryId?: string | null; // default null
```

**page.tsx 新增 State**：
```ts
history: HistoryItem[]        // useState(() => loadHistory())
isHistoryOpen: boolean        // useState(false)
selectedHistoryId: string | null  // useState(null)
```

**page.tsx 新增回调逻辑**：
```ts
// 生成成功后（setResultImage 之后）
setSelectedHistoryId(null);
addHistoryItem(data.resultImage, history).then(setHistory);

// handleHistoryToggle
setIsHistoryOpen(prev => !prev);

// handleHistorySelect
setResultImage(item.thumbnail);
setSelectedHistoryId(item.id);

// handleHistoryDelete
const next = deleteHistoryItem(id, history);
setHistory(next);
if (selectedHistoryId === id) setSelectedHistoryId(null);
if (next.length === 0) setIsHistoryOpen(false);
```

**新增设计 Token**：
| Tailwind class | 用途 |
|---------------|------|
| `ring-2 ring-purple-500` | 历史缩略图选中态边框 |
| `opacity-50 cursor-not-allowed` | "历史记录"按钮禁用态 |
| `bg-gray-50 border-t border-gray-100` | 历史面板背景 |
