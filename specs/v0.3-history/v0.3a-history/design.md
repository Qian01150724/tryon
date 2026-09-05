# Design: v0.3a 生成历史记录

> 入口：本文件是 plan 阶段的设计上下文。`design/screenshots/` 里的截图才是实施时的视觉 ground truth——本 md 不替代它们。
> 来源：spec.md、clarify.md、design/screenshots/01-history-bar.png、design/screenshots/image.png

## 1. 产品概述

在现有换装结果卡的底部操作栏中，将原来的"重新生成"按钮替换为"历史记录"按钮；点击后在结果卡正下方展开/收起一条横向缩略图列表，展示历次生成的结果。无历史时按钮灰色禁用。独立的"重新生成"按钮保留在结果卡上方，功能不变。

## 2. 页面 / 模块清单

### M1. ResultDisplay 底部操作栏改造（修改已有组件）

- **视觉 ground truth**：
  - 现状截图：`design/screenshots/image.png`（当前页面：底部有"下载"+ "重新生成"）
  - 设计草图：`design/screenshots/01-history-bar.png`（变更方向：底部"重新生成"→"历史记录"）
- **变更内容**：
  - 结果卡底部操作栏：`下载` | `历史记录`（原来是 `下载` | `重新生成`）
  - "历史记录"无历史时 `disabled` + 灰色样式
  - "历史记录"有历史时可点击，点击切换展开/收起状态（显示 ▼/▲）
  - 结果卡上方的独立"重新生成"按钮不动
- **关联 FR**：FR-004

### M2. HistoryPanel 展开面板（新建）

- **视觉 ground truth**：_(设计草图未画展开态，按以下描述实现)_
- **用途**：点击"历史记录"后，在结果卡正下方展开的横向缩略图列表
- **交互**：
  - 展开/收起由父组件 `isOpen` 状态控制，带简单淡入动画
  - 横向排列，超出宽度可横向滚动
  - 每条：缩略图 + 相对时间（每分钟刷新）+ 右上角删除按钮（×）
  - 当前选中项高亮边框（`ring-2 ring-purple-500`）
  - 点击缩略图切换当前结果图，面板保持展开
- **数据模型**：
  ```
  HistoryItem {
    id: string,         // 时间戳字符串
    timestamp: number,  // Unix ms
    thumbnail: string,  // base64，120px 宽 JPEG 0.85
  }
  ```
- **关联 FR**：FR-004, FR-005, FR-006

### M3. lib/history.ts（新建工具函数）

- **视觉 ground truth**：无 UI
- **核心函数**：
  - `loadHistory(): HistoryItem[]`
  - `addHistoryItem(resultImage: string): HistoryItem[]`（生成缩略图 + 写入 + 淘汰旧记录，返回新列表）
  - `deleteHistoryItem(id: string, items: HistoryItem[]): HistoryItem[]`
- **约束**：写入包裹 try/catch，QuotaExceededError 静默处理
- **关联 FR**：FR-001, FR-002, FR-003, FR-006

### M4. page.tsx 状态联动（修改已有文件）

- **视觉 ground truth**：无新 UI
- **变更**：
  - 维护 `history: HistoryItem[]` 和 `isHistoryOpen: boolean` state
  - 生成成功后调用 `addHistoryItem` 并更新 history state
  - 向 ResultDisplay 传入 `history`、`isHistoryOpen`、`onHistoryToggle`、`onHistorySelect`、`onHistoryDelete`
- **关联 FR**：FR-001, FR-005

## 3. 全局约束 & 设计 token

### 3.1 通用约束
- 沿用现有 Tailwind 样式体系，不引入新依赖
- localStorage key：`tryon_history`，上限 10 条
- 相对时间每分钟 setInterval 刷新，组件卸载时 clearInterval

### 3.2 设计 token（沿用现有，新增部分）

| Token（Tailwind class） | 用途 |
|------------------------|------|
| `ring-2 ring-purple-500` | 历史缩略图选中态边框 |
| `opacity-50 cursor-not-allowed` | "历史记录"按钮禁用态 |
| `bg-gray-50 border-t border-gray-100` | 历史面板背景 |

## 4. 设计产物索引

### 4.1 产物清单

| 文件 | 用途 |
|------|------|
| `design/screenshots/image.png` | 当前实际页面截图（视觉 ground truth 基线） |
| `design/screenshots/01-history-bar.png` | 设计变更草图（底部按钮替换方向） |

### 4.2 每模块产物映射

| 模块 | 截图 | 关联 FR |
|------|------|---------|
| M1. 底部操作栏改造 | `image.png`（现状）+ `01-history-bar.png`（变更） | FR-004 |
| M2. HistoryPanel | 无截图（按 §2 M2 描述实现） | FR-004, FR-005, FR-006 |
| M3. lib/history.ts | 无 UI | FR-001~FR-003, FR-006 |
| M4. page.tsx 联动 | 无新 UI | FR-001, FR-005 |

## 5. 关键设计决策

- **入口按钮替换**：结果卡底部"重新生成"→"历史记录"，上方独立"重新生成"保留（草图决策）
- **展开方式选 A**：点击"历史记录"在结果卡下方 toggle 展开横向缩略图列表，不用 Modal/Drawer（用户确认）
- **只存缩略图**（clarify Q4 选 B）：切换历史时 resultImage 使用缩略图，不存原始大图
- **相对时间实时刷新**（clarify Q2 选 B）：每分钟更新
- **工具函数独立**：存储逻辑在 `lib/history.ts`，组件只负责渲染

## 6. 设计阶段发现的 spec 缺口

- **FR-004 描述需更新**：spec 写"结果区下方渲染横向可滚动列表"（常驻），实际设计是"点击'历史记录'按钮展开/收起"。plan 按实际设计实现，spec 勘误留 finish 记录。
- **FR-005 措辞需更新**：写"原始尺寸 base64"，clarify Q4 决定只存缩略图。plan 按 clarify 实现。
- 以上两处缺口均可在 plan 内消化，不需要回退 specify。

## 7. Design 产出

| 模块 | 状态 |
|------|------|
| M1. 底部操作栏 | 已有截图参考 |
| M2. HistoryPanel | 按文字描述实现 |
| M3/M4. 逻辑层 | 无需视觉产物 |

---

## 8. 开发注意事项

> ⚠️ **开发人员必读——不要跳过这一节直接开始写代码。**

### 8.1 先对照截图确认改动范围
- `design/screenshots/image.png`：当前页面现状，确认底部操作栏位置
- `design/screenshots/01-history-bar.png`：变更草图，确认按钮替换方向

### 8.2 逐批实现，每批验证
1. `lib/history.ts` 工具函数 → DevTools Console 手动验证读写/淘汰/删除
2. ResultDisplay 底部按钮替换 → 确认禁用态和开关状态正确
3. HistoryPanel 组件 → 用 mock 数据确认缩略图渲染、相对时间、删除交互
4. page.tsx 端到端联动 → 完整跑一次生成→历史出现→点击切换→删除

### 8.3 自检要点
- 无历史时："历史记录"灰色禁用，面板不渲染
- 生成成功后：按钮变为可用，点击展开，缩略图可见
- 刷新页面后：历史记录依然存在
- 第 11 次生成：最旧一条自动消失
