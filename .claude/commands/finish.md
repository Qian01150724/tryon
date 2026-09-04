---
description: 收口本轮 spec-kit 循环，生成 finish.md 作为下一轮 specify 的基线
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Finish** 阶段，链路位置：specify → clarify → design → plan → tasks → analyze → **finish**。

> 用途：把本轮链路所有产物压缩成一份**对下一轮有用的事实清单**，写入 `$1/finish.md`。
> 下一轮 `/specify $1` 会读它作为「上一轮基线」，避免重复设计、避免与已落地内容冲突。

## 输入

- `$1`：feature 目录路径（必填）
- 自动读取本轮所有产物：`$1/spec.md`、`$1/clarify.md`、`$1/design.md`、`$1/plan.md`、`$1/tasks.md`、`$1/analyze.md`
- 可选读取：`$1/finish.md`（**上一轮**的 finish.md，如存在；用于把上一轮的"已落地清单"叠加到本轮，再覆盖回写）

## 输出

- **子 spec 收口**（`$1` 是子 spec 目录，如 `specs/001-feature/001a-基座`）：写入 `$1/finish.md`，记录该子 spec 的落地状态。
- **父 spec 全局收口**（`$1` 是父 spec 目录，如 `specs/001-feature`，且下面有子 spec 目录）：读取所有子 spec 的 finish.md，汇总生成 `$1/finish.md`，作为整个 spec 的完成基线。此时不要求父目录下有 spec.md 等六件套——只需子 spec 各自完成即可。

## 前置检查

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/finish specs/002-MMP-refine-UI`」并停止。
2. **判断模式**：检查 `$1` 下是否存在子 spec 目录（包含 `finish.md` 的子目录）。
   - **有子 spec** → 进入「父 spec 全局收口」模式（跳到步骤 5b）。
   - **无子 spec** → 进入「子 spec 收口」模式（继续步骤 3）。
3. （子 spec 模式）必读六件套（spec / clarify / design / plan / tasks / analyze）任一缺失 → 报错并提示对应命令。design.md 可选——纯后端 spec 可能没有。
4. 读 `$1/analyze.md`，**如阻塞性问题数 > 0 → 拒绝执行**：「本轮存在阻塞，禁止 finish。先修阻塞，重跑 /analyze $1 再回来」。
4b. 提示用户确认「所有 task 已实施完毕、测试已通过」。如无法确认，建议中止。**代码是否已推送 / PR 是否已合并不是前提条件**——完成本地编码即可 finish，收口不等于部署上线。

## 执行步骤

### 5a. 子 spec 收口模式

综合本轮六件套 + 上一轮 finish.md（如存在），生成 `$1/finish.md`。

### 5b. 父 spec 全局收口模式

扫描 `$1` 下所有子 spec 目录，读取每个子 spec 的 `finish.md`：
- 如果任一子 spec 缺少 finish.md → 报错：「子 spec `XXXa-名称` 尚未完成，请先运行 `/finish $1/XXXa-名称`」。
- 全部子 spec 都有 finish.md → 汇总生成 `$1/finish.md`，包含所有子 spec 的落地能力、数据/接口/配置、遗留问题。

6. **finish.md 是事实清单，不是文档归档**——不要重复抄 spec/plan 的全文；只压缩"对下一轮 specify 有用的事实"。结构如下：

   ```markdown
   # Finish: <功能名称> — Round <N>

   > 本文件是 <round-N> 完成后的状态快照，作为下一轮 /specify 的基线。
   > 生成时间：<YYYY-MM-DD>
   > 上一轮：Round <N-1>（如存在），见上一版 finish.md 历史。

   ## 1. 本轮做了什么（一句话）
   <一段话>

   ## 2. 已落地能力清单（FR 维度）
   - FR-001：<简述实际落地形态> → 文件 `path/...`
   - FR-002：…

   ## 3. 已落地的数据 / 接口 / 配置（plan 维度）
   - **数据表**：
     - `table_x`：字段 a/b/c，索引 …，迁移文件 `migrations/...`
   - **接口 / 函数**：
     - `GET /api/foo`：入参 …，返回 …
     - `pkg.bar(x)`：…
   - **配置 / 环境变量**：
     - `ENV_X`：用途 …，配置位置 …

   ## 4. 影响的目录 / 模块
   - `apps/...`：新增 / 修改 …
   - `packages/...`：…

   ## 5. 与上一轮 finish.md 的差异（如存在上一轮）
   - 新增：…
   - 修改：…
   - 废弃：…
   （没有上一轮就写「首轮无差异基线」）

   ## 6. 遗留 / 已知问题
   - 已知未解决的 bug、技术债、待优化项
   - 标注「需要在下一轮处理 / 可继续观察 / 已接受」

   ## 7. 下一轮启动建议
   - 下一轮可以直接做的方向（一两句话）
   - 不该再碰的部分（避免下轮 spec 重复定义已落地的 FR）
   ```

7. 写入 `$1/finish.md`。
8. 输出简短总结：本轮 FR 数、新增数据表/接口数、遗留问题数。
9. 末尾提示：

   ```text
   本轮收口完成。

   下一轮启动方式：
   1. 在 $1/brief.md 里写下一轮的新需求（覆盖原内容；这是增量描述，不需要重提已落地的 FR）
   2. 运行 /specify $1
      → /specify 会读 brief.md（新增量）+ 本次的 finish.md（上一轮基线）
      → 链路再次开始：specify → clarify → design → plan → tasks → analyze → finish
   ```

## 约束

- 不要修改本轮任何上游产物（spec / clarify / design / plan / tasks / analyze）。
- 不要照抄上游文档——finish.md 必须是**压缩的事实清单**，让下一轮 specify 在小上下文里就能消化。
- 输出固定路径 `$1/finish.md`。
- 阻塞性 analyze 问题未消除时，禁止生成 finish.md。
