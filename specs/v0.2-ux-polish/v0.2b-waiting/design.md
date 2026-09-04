# Design: v0.2b 等待体验优化

> 入口：本文件是 plan 阶段的设计上下文。
> 来源：specs/v0.2-ux-polish/v0.2b-waiting/spec.md（无 design/ 产物；实现已落地，代码即设计真相）

⚠️ **design/ 目录不存在**。本功能已在代码中完整实现（含 clarify Q1 的改动建议），视觉 ground truth 为运行中页面。

## 1. 产品概述

生成等待状态覆盖从点击"生成"到结果出现的整个时间窗口。v0.2b 让等待"可感知、可控制"：动态提示语告知进展，进度条（含数字）量化进度，取消按钮给用户主动权，30 秒超时兜底保护。

## 2. 页面 / 模块清单

### M1. ResultDisplay 加载态（`components/ResultDisplay.tsx`）

- **视觉 ground truth**：运行页面 + 点击生成后的加载状态
- **原型代码**：`components/ResultDisplay.tsx` isLoading 分支（第 75-92 行）
- **用途**：展示旋转圈、动态提示语、进度条（含数字百分比）
- **核心功能 / 交互**：
  - 5 条提示语每 2 秒切换，循环（关联 FR-001）
  - 进度条 ease-out 曲线，`EXPECTED_MS=40000`，max 90%，旁边显示 `{progress}%`（关联 FR-002，含 clarify Q1 改动）
  - `isLoading` 变 false 时 useEffect cleanup 清除两个 setInterval（关联 SC-005）
- **布局要点**：aspect-[3/4] 容器内垂直居中；进度条为全宽细条，下方文字"预计 15-30 秒"；数字百分比显示在进度条右侧或内嵌
- **关联 FR**：FR-001, FR-002

### M2. GenerateButton 取消态（`components/GenerateButton.tsx`）

- **视觉 ground truth**：isGenerating=true 时的按钮区域
- **原型代码**：`components/GenerateButton.tsx` isGenerating 分支（第 20-39 行）
- **用途**：生成中显示禁用主按钮 + "取消"文字按钮
- **核心功能 / 交互**：
  - 主按钮 disabled + 旋转圈 + label 文字（关联 FR-003）
  - "取消"小按钮调 `onCancel()`（关联 FR-003）
- **关联 FR**：FR-003

### M3. page.tsx 生成控制逻辑（`app/page.tsx`）

- **用途**：管理 AbortController、30 秒超时、handleCancel()
- **核心逻辑**：
  - `handleGenerate()`：创建 AbortController，30s setTimeout，fetch 带 signal（关联 FR-003, FR-004）
  - `handleCancel()`：abort + setStage("idle")（关联 FR-003）
  - catch 分支：区分用户取消 vs 超时（timedOutRef），超时时 setError 并 setStage("error")（关联 FR-004）
- **关联 FR**：FR-003, FR-004

## 3. 全局约束 & 设计 token

### 3.1 通用约束
- 进度条动画 `transition-all duration-300`（每 200ms 更新一次进度值，CSS transition 平滑过渡）
- 加载圈：`border-purple-500 animate-spin`

### 3.2 设计 token（从现有代码提取）

| 值 | 用途 |
|----|------|
| `border-purple-500` | 加载旋转圈颜色 |
| `from-purple-500 to-pink-500` | 进度条渐变色 |
| `bg-gray-200` | 进度条轨道色 |
| `text-gray-600 font-medium` | 提示语文字 |
| `text-xs text-gray-400` | 副文字（预计时间）|

## 4. 设计产物索引

### 4.1 系统级产物
- **实现文件**：`components/ResultDisplay.tsx`、`components/GenerateButton.tsx`、`app/page.tsx`

### 4.2 每页产物映射

| 模块 | 代码 | 关联 FR |
|------|------|---------|
| M1. 加载态 UI | `components/ResultDisplay.tsx` L75-92 | FR-001, FR-002 |
| M2. 取消按钮 | `components/GenerateButton.tsx` L20-39 | FR-003 |
| M3. 控制逻辑 | `app/page.tsx` handleGenerate/handleCancel | FR-003, FR-004 |

## 5. 关键设计决策

- **EXPECTED_MS = 40000**：使 ease-out 曲线在整个 30s 窗口持续增长（30s 时约 89%），不冻结（clarify Q1 答复 B）
- **数字百分比显示**：在进度条旁渲染 `{progress}%`，与进度条配合（clarify Q1 答复 B 附加）
- **游离计时器**：handleCancel 不清除 timeoutId，已接受（clarify Q2 答复 A）
- **queued/processing 统一**：两阶段均显示进度，不区分（clarify Q3 答复 A）

## 6. 设计阶段发现的 spec 缺口

- clarify Q1 确定了 EXPECTED_MS=40000 和数字显示，这是对 FR-002 的具体化，不构成新 FR，在 plan 中承接即可。

## 7. Design 产出

| 模块 | 产物 | 状态 |
|------|------|------|
| M1. 加载态 | `components/ResultDisplay.tsx` | ✅ 已实现（需改 EXPECTED_MS + 加数字） |
| M2. 取消按钮 | `components/GenerateButton.tsx` | ✅ 已实现 |
| M3. 控制逻辑 | `app/page.tsx` | ✅ 已实现 |

---

## 8. 开发注意事项

### 8.1 代码即真相
无独立设计稿，`components/ResultDisplay.tsx` 的 isLoading 分支是视觉参考。

### 8.2 需要改动的点（clarify Q1）
- `ResultDisplay.tsx`：`EXPECTED_MS` 从 `8000` 改为 `40000`
- `ResultDisplay.tsx`：进度条旁新增 `{progress}%` 数字显示

### 8.3 验证路径
1. 点击生成 → 观察提示语每 2 秒切换
2. 观察进度数字持续增长，不在 90% 冻结（30s 内）
3. 点取消 → 返回 idle，加载态消失
4. 模拟超时（DevTools throttle / 等 30s）→ 出现超时提示
