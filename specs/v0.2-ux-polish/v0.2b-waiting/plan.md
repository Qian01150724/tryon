# Plan: v0.2b 等待体验优化

## 1. 总体方案

三处改动，全部客户端，不涉及服务端：
1. `ResultDisplay.tsx`：`EXPECTED_MS` 改为 40000，进度条旁新增数字 `{progress}%`（clarify Q1 答复）
2. `ResultDisplay.tsx`：`LOADING_STEPS` 5 条提示语和 2 秒切换逻辑已实现，无需改动
3. `GenerateButton.tsx` + `page.tsx`：取消按钮和 AbortController 已实现，无需改动
4. `page.tsx`：30 秒超时已实现，无需改动

本轮唯一实质改动：**EXPECTED_MS 常量值 + 一行数字显示**。其余均为已落地功能的文档补齐。

## 2. 技术选型

| 功能 | 技术 | 选型理由 |
|------|------|---------|
| 提示语切换 | `setInterval` + `useState` | 浏览器原生，最简 |
| 进度曲线 | `1 - Math.exp(-3 * ratio)`，`EXPECTED_MS=40000` | ease-out 曲线，整个 30s 窗口持续增长不冻结 |
| 数字显示 | JSX inline `{progress}%` | 无需库，直接渲染 |
| 取消 | `AbortController.abort()` | 浏览器原生，无需第三方 |
| 超时 | `setTimeout` + `timedOutRef` | 最简实现，区分用户取消 vs 超时 |

## 3. 架构与目录结构

```
components/
├── ResultDisplay.tsx   ← 改动：EXPECTED_MS 40000 + {progress}% 显示
└── GenerateButton.tsx  ← 无需改动（取消按钮已实现）

app/
└── page.tsx            ← 无需改动（AbortController + 超时已实现）
```

## 4. 数据模型

纯客户端状态，无持久化：

| State / Ref | 类型 | 位置 | 用途 |
|-------------|------|------|------|
| `stepIndex` | `number` | ResultDisplay | 当前提示语索引 |
| `progress` | `number` | ResultDisplay | 进度百分比 0-90 |
| `abortRef` | `MutableRefObject<AbortController\|null>` | page.tsx | 控制请求取消 |
| `timedOutRef` | `MutableRefObject<boolean>` | page.tsx | 区分超时 vs 用户取消 |

## 5. 接口契约

### `EXPECTED_MS`（常量）
- 当前值：8000
- 改后值：**40000**
- 作用：进度曲线公式 `ratio = elapsed / EXPECTED_MS`；值越大曲线越平缓，30s 内约达 89%

### 进度公式
```ts
const ratio = (Date.now() - start) / EXPECTED_MS;
setProgress(Math.min(90, Math.round(100 * (1 - Math.exp(-3 * ratio)))));
```
- 更新频率：每 200ms
- 上限：90（不假装完成）

### 数字显示位置
进度条行内，右侧对齐显示 `{progress}%`，与进度条同行。

## 6. 配置与环境变量

无。`EXPECTED_MS` 为模块级常量，不需要可配置（clarify Q3 已确认）。

## 7. 安全 / 性能 / 可观测性

**性能**：
- setInterval 每 200ms 触发进度更新，`isLoading` 变 false 时 useEffect cleanup 清除，无泄漏
- stepIndex setInterval 每 2000ms，同样在 cleanup 清除

**可观测性**：
- 进度数字对用户直接可见
- 超时错误文本"生成超时（超过 30 秒），请重试"对用户可见

## 8. 风险与回滚

| 风险 | 概率 | 缓解 |
|------|------|------|
| EXPECTED_MS 改大后进度增长过慢，用户感觉没反应 | 低 | 40000 在 10s 时约 53%，增长感明显 |
| 游离 timeoutId 在极端情况下误触发 | 极低 | timedOutRef 在新一轮 handleGenerate 开头重置为 false |

**回滚**：仅改一个常量和一行 JSX，git revert 单文件即可。

## 9. 与 spec 的对应关系

| FR/SC | 实现位置 |
|-------|---------|
| FR-001 提示语 5 条 / 2 秒切换 | `ResultDisplay.tsx` LOADING_STEPS + setInterval 2000ms |
| FR-002 进度条 ease-out max90% + 数字 | `ResultDisplay.tsx` EXPECTED_MS=40000 + `{progress}%` |
| FR-003 取消 / 回 idle | `GenerateButton.tsx` onCancel + `page.tsx` handleCancel |
| FR-004 30s 超时 / 重试提示 | `page.tsx` TIMEOUT_MS + timedOutRef + setError |
| SC-001 每 2 秒切换 | setInterval 2000ms |
| SC-002 进度始终 ≤ 90% | Math.min(90, ...) |
| SC-003 取消后 stage=idle | handleCancel setStage("idle") |
| SC-004 超时提示文字 | catch 分支 setError("生成超时（超过 30 秒），请重试") |
| SC-005 计时器清除 | useEffect return () => clearInterval |

## 10. 与 constitution.md 的合规检查

constitution.md 不存在，跳过。
