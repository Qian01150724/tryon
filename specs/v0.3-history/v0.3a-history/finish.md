# Finish: v0.3a 生成历史记录 — Round 1

> 本文件是 Round 1 完成后的状态快照，作为下一轮 /specify 的基线。
> 生成时间：2026-09-05
> 上一轮：无（首轮）

## 1. 本轮做了什么（一句话）

在客户端新增 localStorage 历史记录功能：换装生成成功后自动存储缩略图，结果卡底部提供"历史记录"入口，点击展开横向缩略图列表，支持切换回看与删除，上限 10 条自动淘汰最旧。

---

## 2. 已落地能力清单（FR 维度）

- **FR-001**：生成成功后自动调用 `addHistoryItem`，写入 localStorage → `app/page.tsx`（生成回调内）
- **FR-002**：`HistoryItem { id, timestamp, thumbnail }` 存储结构；Canvas 等比缩至 120px、JPEG 0.85 → `lib/history.ts`
- **FR-003**：写入时 `slice(-10)` 保留最新 10 条，超出自动淘汰最旧 → `lib/history.ts addHistoryItem`
- **FR-004**：结果卡底部"🕐 历史记录 ▼/▲"按钮（按 design 决策：展开/收起面板，非常驻列表）；无历史时禁用灰色；`HistoryPanel` 横向可滚动缩略图列表 → `components/ResultDisplay.tsx`、`components/HistoryPanel.tsx`
- **FR-005**：点击历史缩略图将 thumbnail base64 设为当前 resultImage（按 clarify Q4 选 B：只存缩略图，切换时使用缩略图）→ `app/page.tsx handleHistorySelect`
- **FR-006**：每条缩略图右上角 `×` 删除按钮，调用 `deleteHistoryItem` 更新 localStorage 并同步 state → `components/HistoryPanel.tsx`、`app/page.tsx handleHistoryDelete`

> **spec 缺口消化（已在 plan/design 内处理，无需回溯）**：
> - FR-004 原文"常驻列表" → 实际落地为"按钮展开面板"
> - FR-005 原文"原始尺寸 base64" → 实际落地为"缩略图 base64"（clarify Q4 选 B）

---

## 3. 已落地的数据 / 接口 / 配置

**存储**：
- `localStorage` key `tryon_history`，value：`HistoryItem[]` JSON，上限 10 条

**接口（`lib/history.ts` 导出）**：
- `loadHistory(): HistoryItem[]` — 读取并解析，失败返回 `[]`
- `addHistoryItem(resultImage, current): Promise<HistoryItem[]>` — 生成缩略图、追加、淘汰、写入；异常静默返回原数组
- `deleteHistoryItem(id, current): HistoryItem[]` — 过滤后写入，返回新数组
- `formatRelativeTime(timestamp): string` — 刚刚 / N 分钟前 / N 小时前 / N 天前
- `interface HistoryItem { id: string; timestamp: number; thumbnail: string }`

**常量（定义在 `lib/history.ts` 顶部）**：
- `HISTORY_KEY = 'tryon_history'`
- `HISTORY_MAX = 10`
- `THUMBNAIL_WIDTH = 120`
- `THUMBNAIL_QUALITY = 0.85`

**无新增环境变量 / 服务端配置。**

---

## 4. 影响的目录 / 模块

- `lib/history.ts`：新建，纯客户端工具函数
- `components/HistoryPanel.tsx`：新建，横向缩略图列表组件；内含 `setInterval` 每分钟刷新相对时间，`useEffect` 清除
- `components/ResultDisplay.tsx`：修改底部操作栏（"重新生成"→"历史记录"按钮）、新增 6 个 history 相关 props、条件渲染 `HistoryPanel`
- `app/page.tsx`：新增 `history` / `isHistoryOpen` / `selectedHistoryId` state，生成成功回调写入历史，传入 ResultDisplay 所有 history props

---

## 5. 与上一轮 finish.md 的差异

首轮，无差异基线。

---

## 6. 遗留 / 已知问题

- **缩略图画质**：切换历史时 resultImage 使用 120px 缩略图，放大弹窗会显示低清图像。已接受（clarify Q4 选 B），若需改善可在下一轮引入中等尺寸（600px）存储字段。
- **相对时间精度**：组件挂载时时间已固定，仅每分钟刷新。若用户在"刚刚"边界时打开面板，显示可能有最多 60 秒延迟。可继续观察，影响极小。
- **无空历史提示**：HistoryPanel 在 `items.length === 0` 时直接返回 null，无"暂无历史"文案。无历史时按钮本身已禁用，面板不展示，逻辑自洽；下一轮若需要可补充。
- **历史记录与重新生成的 selectedHistoryId 联动**：重新生成时 selectedHistoryId 重置为 null，但 resultImage 会变成新结果，历史面板选中态正确清空。已验证逻辑无问题。

---

## 7. 下一轮启动建议

- **可以做的方向**：v0.3b 或后续轮可考虑给历史记录加标签/备注（目前 HistoryItem 为最小集）；或增加"清空全部历史"操作；或将缩略图升级为 600px 中等尺寸以改善放大效果。
- **不该再碰的部分**：`lib/history.ts` 接口契约、localStorage 存储格式和 key 名已稳定，下一轮不应在 spec 中重新定义这些基础设施；如需扩展字段，以此 finish.md §3 为基线做增量变更。
