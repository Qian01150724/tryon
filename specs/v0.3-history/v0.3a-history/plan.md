# Plan: v0.3a 生成历史记录

## 1. 总体方案

新建 `lib/history.ts` 封装 localStorage 读写逻辑；新建 `components/HistoryPanel.tsx` 渲染横向缩略图列表；修改 `components/ResultDisplay.tsx` 将底部"重新生成"替换为"历史记录"按钮（含展开/收起 HistoryPanel 的状态）；修改 `app/page.tsx` 维护历史列表 state，在生成成功时写入历史，并向下传递选中/删除回调。全程纯客户端，无新依赖。

> **承接 design.md §6 缺口**：FR-004/FR-005 措辞与 clarify 决定有偏差，本 plan 按实际决策实现（入口按钮展开面板、只存缩略图），不按 spec 原文执行。

---

## 2. 技术选型

| 技术 | 选型 | 理由 |
|------|------|------|
| 存储 | `localStorage` | 纯客户端，无需服务端，符合隐私原则 |
| 缩略图生成 | `Canvas 2D + FileReader` | 浏览器原生，无需额外库 |
| 相对时间 | 自行实现 `formatRelativeTime()` | 逻辑简单（< 10 行），不引入 dayjs/date-fns |
| 样式 | Tailwind CSS | 与项目现有体系一致 |
| 新增依赖 | 无 | — |

---

## 3. 架构与目录结构

```
app/
  page.tsx                  ← 修改：增加 history/isHistoryOpen state，传 props
components/
  ResultDisplay.tsx         ← 修改：底部按钮替换，接收 history 相关 props
  HistoryPanel.tsx          ← 新建：横向缩略图列表组件
lib/
  history.ts                ← 新建：localStorage 读写工具函数
```

---

## 4. 数据模型

### localStorage 结构

- **Key**：`tryon_history`
- **Value**：`JSON.stringify(HistoryItem[])`，按 `timestamp` 升序排列（最旧在前）
- **上限**：10 条，写入时超出则删除 `items[0]`

```ts
interface HistoryItem {
  id: string;         // String(Date.now())
  timestamp: number;  // Date.now()
  thumbnail: string;  // base64 data URL，Canvas 等比缩至宽 120px，JPEG 0.85
}
```

---

## 5. 接口契约

### `lib/history.ts`

```ts
// 从 localStorage 读取历史，解析失败返回空数组
function loadHistory(): HistoryItem[]

// 将 resultImage 压缩为缩略图，追加到历史，超出 10 条淘汰最旧，写回 localStorage
// 返回新的历史数组；写入失败时静默跳过，返回传入的原数组
async function addHistoryItem(
  resultImage: string,
  current: HistoryItem[]
): Promise<HistoryItem[]>

// 删除指定 id 的记录，写回 localStorage，返回新数组
function deleteHistoryItem(id: string, current: HistoryItem[]): HistoryItem[]

// 将 resultImage base64 等比缩至宽 120px，输出 JPEG 0.85 base64
async function generateThumbnail(dataUrl: string): Promise<string>

// 将 timestamp 转为相对时间字符串（"刚刚"/"N 分钟前"/"N 小时前"/"N 天前"）
function formatRelativeTime(timestamp: number): string
```

### `components/HistoryPanel.tsx`

```ts
interface HistoryPanelProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}
```

### `components/ResultDisplay.tsx` 新增 Props

```ts
history: HistoryItem[];
isHistoryOpen: boolean;
onHistoryToggle: () => void;
onHistorySelect: (item: HistoryItem) => void;
onHistoryDelete: (id: string) => void;
selectedHistoryId: string | null;
```

---

## 6. 配置与环境变量

无新增配置项。`tryon_history` 为硬编码常量，定义在 `lib/history.ts` 顶部：

```ts
const HISTORY_KEY = 'tryon_history';
const HISTORY_MAX = 10;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_QUALITY = 0.85;
```

---

## 7. 安全 / 性能 / 可观测性

- **localStorage 容量**：10 条 × ~30KB = ~300KB，远低于 5MB 上限，无溢出风险
- **写入保护**：`addHistoryItem` 包裹 try/catch，`QuotaExceededError` 静默处理，不影响主流程
- **内存**：`setInterval`（相对时间刷新）在 HistoryPanel 卸载时 `clearInterval`，无泄漏
- **隐私**：历史数据仅存本地，不上传，符合 intent.md 隐私原则
- **性能**：缩略图生成为异步，不阻塞 UI；Canvas 操作在内存中完成，不挂载到 DOM

---

## 8. 风险与回滚

| 风险 | 概率 | 应对 |
|------|------|------|
| Canvas API 在某些浏览器不支持 | 低 | `generateThumbnail` 失败时 catch 后跳过存储，不影响展示结果 |
| localStorage 被用户手动清空 | 正常 | `loadHistory` 解析失败返回 `[]`，面板为空，按钮禁用，无报错 |
| 历史数据 JSON 格式损坏 | 低 | `loadHistory` 用 try/catch，异常时清空 key 并返回 `[]` |

**回滚**：本次改动涉及 4 个文件（2 新建、2 修改），均无破坏性变更，回滚只需还原 ResultDisplay.tsx 和 page.tsx 的 props，删除新文件即可。

---

## 9. 与 spec 的对应关系

| FR/SC | 实现位置 | 说明 |
|-------|---------|------|
| FR-001 | `lib/history.ts` `addHistoryItem` + `page.tsx` | 生成成功后调用 |
| FR-002 | `lib/history.ts` `generateThumbnail` | 120px / JPEG 0.85 |
| FR-003 | `lib/history.ts` `addHistoryItem`（淘汰逻辑） | 超 10 条删最旧 |
| FR-004 | `ResultDisplay.tsx`（按钮）+ `HistoryPanel.tsx`（面板） | 按设计：入口按钮 + 展开面板；FR-004 原文"常驻列表"按 design 缺口消化 |
| FR-005 | `page.tsx` `onHistorySelect` | 只切换 resultImage（缩略图），不还原原图侧 |
| FR-006 | `lib/history.ts` `deleteHistoryItem` + `HistoryPanel.tsx` | 删除按钮 |
| SC-001 | `page.tsx` 生成成功回调 | 自动写入 |
| SC-002 | `lib/history.ts` `loadHistory` | 页面加载时读取 |
| SC-003 | `addHistoryItem` 淘汰逻辑 | |
| SC-004 | `deleteHistoryItem` | |
| SC-005 | `addHistoryItem` try/catch | 静默跳过 |

---

## 10. 与 constitution.md 的合规检查

constitution.md 不存在，跳过。项目自身原则（来自 intent.md）：

| 原则 | 状态 |
|------|------|
| 隐私：图片不上传、不存储到服务端 | ✅ 纯 localStorage，无网络请求 |
| 极简操作：不增加无谓步骤 | ✅ 入口在结果卡内，一键展开 |
| 无需登录注册 | ✅ 无用户系统依赖 |
