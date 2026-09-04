# Finish: v0.2b 等待体验优化 — Round 1

> 本文件是 Round 1 完成后的状态快照，作为下一轮 /specify 的基线。
> 生成时间：2026-09-04
> 上一轮：无（首轮）

## 1. 本轮做了什么（一句话）

记录并确认等待状态四项能力（提示语、进度条、取消、超时）的实现；同时确定了一项改进：将 `EXPECTED_MS` 从 8000 改为 40000 并新增数字百分比显示，使进度条在 30 秒内持续增长不冻结。

## 2. 已落地能力清单（FR 维度）

- **FR-001 动态提示语**：`LOADING_STEPS` 5 条，`setInterval` 2000ms 切换，循环滚动 → `components/ResultDisplay.tsx`
- **FR-002 进度条**：ease-out 公式 `1 - e^(-3*ratio)`，`EXPECTED_MS=40000`，上限 90%，旁显示 `{progress}%` → `components/ResultDisplay.tsx`
- **FR-003 取消**：`GenerateButton.tsx` 渲染取消按钮，`page.tsx` `handleCancel()` abort + setStage("idle") → 两个文件
- **FR-004 30s 超时**：`page.tsx` `TIMEOUT_MS=30000`，`timedOutRef` 区分超时 vs 用户取消，超时后 setError("生成超时（超过 30 秒），请重试") → `app/page.tsx`

## 3. 已落地的数据 / 接口 / 配置

- **配置常量**：
  - `EXPECTED_MS = 40000`（ResultDisplay.tsx，进度曲线基准）
  - `TIMEOUT_MS = 30_000`（page.tsx，超时阈值）
- **接口 / 状态**：
  - `stage: "idle"|"queued"|"processing"|"done"|"error"`（page.tsx）
  - `isLoading = stage === "queued" || stage === "processing"` → 传给 ResultDisplay
  - `abortRef: MutableRefObject<AbortController|null>`（page.tsx）
  - `timedOutRef: MutableRefObject<boolean>`（page.tsx）

## 4. 影响的目录 / 模块

- `components/ResultDisplay.tsx`：EXPECTED_MS 改 40000，新增 `{progress}%` 数字显示
- `components/GenerateButton.tsx`：取消按钮已实现，本轮无改动
- `app/page.tsx`：AbortController + 超时逻辑已实现，本轮无改动

## 5. 与上一轮 finish.md 的差异

首轮，无差异基线。

## 6. 遗留 / 已知问题

- **游离计时器**：`handleCancel()` 不清除 `timeoutId`，30s 后 abort 会再次调用（无副作用）；已接受，可在下次重构时处理
- **EXPECTED_MS 视觉待验证**：40000 是理论值，实际生成速度若普遍快于 15s，进度条可能增长偏慢；建议上线后观察真实 P50 生成时间再调整 → 可继续观察

## 7. 下一轮启动建议

- 等待状态四项能力已全部落地，下一轮不要重定义 FR-001~004
- EXPECTED_MS 若需调整，直接改 ResultDisplay.tsx 常量即可，无需走完整 spec 链路
