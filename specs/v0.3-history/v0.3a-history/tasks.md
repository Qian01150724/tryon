# Tasks

> 来源：specs/v0.3-history/v0.3a-history/plan.md
> 规则：按顺序执行，未通过验证不得进入下一个 task。
> UI 类任务实施前必读：design/screenshots/ 下对应截图（见每个 UI 任务的「视觉参考」字段）

---

## Task #1: 创建 lib/history.ts 工具函数

- **目标**：实现历史记录的 localStorage 读写、缩略图生成、淘汰逻辑、删除逻辑；定义 `HistoryItem` 类型并导出，供后续组件使用。
- **改动文件**：
  - `lib/history.ts`（新建）
- **实现要点**：
  - 顶部定义常量：`HISTORY_KEY = 'tryon_history'`、`HISTORY_MAX = 10`、`THUMBNAIL_WIDTH = 120`、`THUMBNAIL_QUALITY = 0.85`
  - 导出 `HistoryItem` 接口：`{ id: string; timestamp: number; thumbnail: string }`
  - `loadHistory()`：读取 localStorage，JSON.parse 失败时清空 key 并返回 `[]`
  - `generateThumbnail(dataUrl: string): Promise<string>`：Canvas 2D 等比缩至宽 120px，输出 JPEG 0.85 base64；失败时 throw
  - `addHistoryItem(resultImage: string, current: HistoryItem[]): Promise<HistoryItem[]>`：
    - 调用 `generateThumbnail` 生成缩略图
    - 构造新记录：`{ id: String(Date.now()), timestamp: Date.now(), thumbnail }`
    - 追加到 current，若长度超过 10 则 `items.slice(-10)`（保留最新 10 条）
    - 写入 localStorage；try/catch 包裹，QuotaExceededError 静默跳过，返回原数组
    - 正常返回新数组
  - `deleteHistoryItem(id: string, current: HistoryItem[]): HistoryItem[]`：filter 掉目标 id，写回 localStorage，返回新数组
  - `formatRelativeTime(timestamp: number): string`：
    - < 60s → "刚刚"
    - < 3600s → "N 分钟前"
    - < 86400s → "N 小时前"
    - 否则 → "N 天前"
- **验证**：
  - 在浏览器 DevTools Console 中手动测试：
    ```js
    import { addHistoryItem, loadHistory, deleteHistoryItem } from './lib/history'
    // 或直接在页面加载后通过 window 挂载调试
    ```
  - 预期：`loadHistory()` 返回 `[]`；调用 `addHistoryItem` 后 `loadHistory()` 返回 1 条；写入 11 条后 localStorage 中仍只有 10 条；`deleteHistoryItem` 后对应条目消失
- **对应**：plan §3（lib/history.ts）/ plan §5（接口契约）/ FR-001, FR-002, FR-003, FR-006

---

## Task #2: 新建 HistoryPanel 组件 + 改造 ResultDisplay 底部操作栏

- **目标**：新建 `HistoryPanel` 横向缩略图列表组件；修改 `ResultDisplay` 底部操作栏，将"重新生成"替换为"历史记录"按钮，并在按钮下方条件渲染 `HistoryPanel`。此 task 完成后可在浏览器里用 mock 数据看到完整 UI 交互。
- **改动文件**：
  - `components/HistoryPanel.tsx`（新建）
  - `components/ResultDisplay.tsx`（修改）
- **实现要点**：
  - **HistoryPanel.tsx**：
    - Props：`{ items: HistoryItem[]; selectedId: string | null; onSelect: (item: HistoryItem) => void; onDelete: (id: string) => void; }`
    - 无记录时不渲染（`if (!items.length) return null`）
    - 容器：`bg-gray-50 border-t border-gray-100`，横向 flex，`overflow-x-auto`，`gap-2 p-2`
    - 每条记录：
      - 缩略图 `<img>` 宽 `w-[72px] h-[96px]`，`object-cover rounded`
      - 选中态：`ring-2 ring-purple-500`
      - 右上角删除按钮 `×`（绝对定位，`text-xs`）
      - 底部相对时间文字（`text-[10px] text-gray-500`）
    - 相对时间：使用 `formatRelativeTime`，组件内 `setInterval` 每 60 秒触发 `forceUpdate`（可用 `useState` + `setInterval`），`useEffect` 返回 `clearInterval`
    - 点击缩略图（非删除按钮）调用 `onSelect`，面板不收起
  - **ResultDisplay.tsx**：
    - 新增 Props：`history: HistoryItem[]; isHistoryOpen: boolean; onHistoryToggle: () => void; onHistorySelect: (item: HistoryItem) => void; onHistoryDelete: (id: string) => void; selectedHistoryId: string | null`
    - 底部操作栏：原"重新生成"按钮替换为"历史记录"按钮
      - 无历史时：`disabled`，`opacity-50 cursor-not-allowed`，无 onClick
      - 有历史时：可点击，文字 `历史记录 ▼`（展开）/ `历史记录 ▲`（收起），onClick 调用 `onHistoryToggle`
    - 按钮下方：`{isHistoryOpen && <HistoryPanel ... />}`
    - 结果卡上方已有的独立"重新生成"按钮**不动**
- **视觉参考**：
  - **本任务对应截图**：`design/screenshots/image.png`（当前页面现状，确认底部操作栏位置）
  - **设计变更方向**：`design/screenshots/01-history-bar.png`（底部按钮替换草图，以此为实施 ground truth）
  - **设计 token**：`ring-2 ring-purple-500`（选中），`opacity-50 cursor-not-allowed`（禁用），`bg-gray-50 border-t border-gray-100`（面板背景）
- **验证**：
  - 命令：`pnpm dev`，打开浏览器
  - 预期：
    - 无历史时：底部"历史记录"按钮灰色禁用，面板不渲染
    - 临时在 ResultDisplay 传入 mock history（1 条）：按钮可点击，点击后横向面板展开，缩略图可见，时间文字出现，再次点击收起
    - 点击缩略图右上角 `×`：调用 onDelete（console.log 确认）
  - UI 附加：**人工对比截图 `01-history-bar.png`，底部按钮位置与样式一致**
- **对应**：plan §3（HistoryPanel + ResultDisplay）/ plan §5（接口契约）/ FR-004, FR-006

---

## Task #3: 修改 page.tsx 完成端到端状态联动

- **目标**：在 `page.tsx` 中维护 history state，生成成功后自动写入历史；向 ResultDisplay 传入所有 history 相关 props；实现点击历史缩略图切换 resultImage。此 task 完成后整个功能端到端可用。
- **改动文件**：
  - `app/page.tsx`（修改）
- **实现要点**：
  - 导入 `loadHistory`、`addHistoryItem`、`deleteHistoryItem`、`HistoryItem`
  - 新增 state：
    - `const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())`（初始化时读取 localStorage）
    - `const [isHistoryOpen, setIsHistoryOpen] = useState(false)`
    - `const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)`
  - 生成成功回调处（现有 setResultImage 之后）：
    ```ts
    const newHistory = await addHistoryItem(resultImageBase64, history);
    setHistory(newHistory);
    setSelectedHistoryId(null); // 新生成，选中态重置
    ```
  - `onHistoryToggle`：`setIsHistoryOpen(prev => !prev)`
  - `onHistorySelect`：
    ```ts
    (item: HistoryItem) => {
      setResultImage(item.thumbnail);
      setSelectedHistoryId(item.id);
    }
    ```
  - `onHistoryDelete`：
    ```ts
    (id: string) => {
      const newHistory = deleteHistoryItem(id, history);
      setHistory(newHistory);
      if (selectedHistoryId === id) setSelectedHistoryId(null);
      if (newHistory.length === 0) setIsHistoryOpen(false);
    }
    ```
  - 向 `<ResultDisplay>` 传入：`history`、`isHistoryOpen`、`onHistoryToggle`、`onHistorySelect`、`onHistoryDelete`、`selectedHistoryId`
- **验证**：
  - 命令：`pnpm dev`，完整端到端测试
  - 场景 1（SC-001）：生成成功后，历史面板点开可见新缩略图
  - 场景 2（SC-002）：刷新页面后点开历史，记录依然存在，点击可切换 resultImage
  - 场景 3（SC-003）：生成 11 次后 localStorage 仍只有 10 条（DevTools 确认）
  - 场景 4（SC-004）：删除一条后列表实时更新，刷新后确认已消失
  - 场景 5（SC-005）：无需额外操作，静默处理由 addHistoryItem try/catch 保证
- **对应**：plan §3（page.tsx）/ plan §5（接口契约）/ FR-001, FR-005 / SC-001~SC-005
