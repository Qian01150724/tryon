# Clarify: v0.2b 等待体验优化

> 来源：specs/v0.2-ux-polish/v0.2b-waiting/spec.md
> 用途：将以下问题确认，得到答案后回填本文件再进入 design / plan 阶段。

## 1. 来自 [NEEDS CLARIFICATION] 的问题

_本 spec 无 `[NEEDS CLARIFICATION]` 标记，此节为空。_

## 2. 技术选型澄清

### Q1. 进度条预期时长（EXPECTED_MS）与超时阈值不对齐

- **位置**：spec.md FR-002 / §6 依赖与约束
- **问题**：`EXPECTED_MS = 8000`（8 秒），进度曲线 `1 - e^(-3t/8000)` 约在 8 秒时到达 ~95% 后被截到 90%，之后进度条停在 90% 一动不动，可能持续长达 22 秒（直到 30 秒超时）。用户可能误解为卡死。
- **可选方案**：
  - A) 维持现状：EXPECTED_MS=8000，进度条可能在 90% 停留很久（当前实现）
  - B) 将 EXPECTED_MS 调大（如 20000），让曲线更平缓，进度条在整个等待期间持续缓慢增长
  - C) 加一句"预计还需 N 秒"动态文字补充，降低进度停滞的视觉焦虑
- **建议**：B。调大 EXPECTED_MS 到 20000，使进度条在 20 秒时达到 ~90%，整体感知更流畅；无需改架构，只改一个常量。
- **答复**：B — EXPECTED_MS 改为 40000，使曲线在整个 30 秒窗口内持续增长（30s 时约 89%，永不冻结）；同时在进度条旁显示数字百分比 `{progress}%`

### Q2. 用户取消时 timeout 计时器未清除

- **位置**：spec.md FR-003 / `app/page.tsx` `handleCancel()`
- **问题**：`handleCancel()` 只调用 `abortRef.current?.abort()` 和 `setStage("idle")`，不清除 `timeoutId`（setTimeout）。用户取消后，30 秒超时定时器仍在运行，到期后会再次调用 `controller.abort()`（已中止的 controller，无副作用）并置 `timedOutRef.current = true`。下次新一轮生成如果在 30 秒内触发，`timedOutRef` 会被新 controller 的 try 开头重置（`timedOutRef.current = false`），不会误报超时。当前行为虽不引发 bug，但存在游离计时器。
- **可选方案**：
  - A) 维持现状：接受游离计时器，行为无害（当前实现）
  - B) 在 `handleCancel()` 中同步清除 `timeoutId`（需将 `timeoutId` 提升为 ref）
- **建议**：A。游离计时器不产生可见副作用，修复会增加代码复杂度；可在下次重构时一并处理。
- **答复**：A — 维持现状，接受游离计时器

## 3. 数据模型 / 接口契约澄清

### Q3. queued 阶段是否也显示取消按钮和进度条

- **位置**：spec.md FR-003 / §6 依赖与约束
- **问题**：spec 写"生成中可取消"，但 `isGenerating = stage === "queued" || stage === "processing"`。排队阶段（queued）也触发加载 UI 和取消按钮，而进度条/提示语在 `isLoading` 为 true 时就开始计时。这是预期行为还是只有 processing 阶段才应显示进度？
- **可选方案**：
  - A) 维持现状：queued 和 processing 统一展示进度条和提示语（当前实现）
  - B) queued 阶段显示"排队中..."静态文字，processing 阶段才启动进度条
- **建议**：A。当前 queued 阶段极短（发出请求前的本地状态切换，几乎为 0 毫秒），用户无感知，无需区分。
- **答复**：A — 维持现状，queued 和 processing 统一显示进度

## 4. 与 constitution.md 的潜在冲突

_项目根目录不存在 `constitution.md`，此节为空。_

---

回填所有 `_(待填)_` 后，下一步运行 `/design specs/v0.2-ux-polish/v0.2b-waiting`。
