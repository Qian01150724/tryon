---
description: 读取 feature 目录下的 brief.md（+ 可选 finish.md）生成 spec.md（Spec-Kit Step 1）
argument-hint: <feature 目录路径，如 specs/002-MMP-refine-UI>
---

你正在执行 Spec-Kit 工作流的 **Specify** 阶段，这是「finish + brief → spec → clarify → design → plan → tasks → analyze → finish」完整循环的入口。

## 输入

- `$1`：feature 目录路径（必填）。本轮所有产物都将落在该目录下。
- `$1/brief.md`：本轮新需求（**必填**，由用户在该目录下手写或覆盖）。
- `$1/finish.md`：上一轮跑完的产物总结（**可选**，首轮没有；存在则作为本轮上下文）。
- `$1/design.md`：已经抽象好的设计索引（**可选**）。如存在则**优先读它**（轻量、上下文小）。
- `$1/design/`：人手在 spec 之前/并行做的设计探索产物（**可选**；HTML / CSS / JS 原型、截图、Figma 链接等）。仅当 `design.md` 不存在时才**回退**扫这个文件夹。如果 design/ 存在但 design.md 不存在，提示用户：「建议先跑 `/design $1` 把 design/ 抽象成 design.md，可以让本次 specify 上下文更小、更聚焦。也可以跳过此建议直接继续」。
- 项目原则：`constitution.md`（如存在则必读）。

## 输出

- 写入文件：`$1/spec.md`（覆盖写入；若目录不存在请先创建）。

## 前置检查

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/specify specs/002-MMP-refine-UI`」并停止。
2. `$1/brief.md` 不存在 → 报错：「该 feature 目录下缺少 brief.md（本轮新需求文件）。请先在 `$1/brief.md` 中写明本轮要做什么，再运行 /specify」并停止。
3. `$1/finish.md` 存在则读取。**finish.md 是上一轮的产物总结**，用于：
   - 让本轮 spec 知道当前系统已有的状态、已落地的能力、遗留的事项
   - 避免本轮重复设计已有功能、或与已有结构冲突
   - 在 spec 的「依赖与约束」「范围与边界」中显式引用 finish.md 的相关条目
4. 如果项目根目录存在 `constitution.md`，读取它，确保 spec 不会与其冲突。
5. **检测已有设计材料**（用户可能在 spec 之前/并行用 claude.ai/design / Figma / 手写原型做了设计探索）。按以下优先级处理：
   - **`$1/design.md` 存在** → 进入「design-aware 模式」（**首选路径**）：直接整文件读入，把设计意图反向消化进 spec。design.md 已经是抽象后的索引，上下文小。
   - **`$1/design.md` 不存在但 `$1/design/` 存在且非空** → 进入「design-aware 模式」（回退路径）：先提示用户「建议先跑 `/design $1` 把 design/ 抽象成 design.md」；如果用户选择继续，则扫描 `$1/design/` 顶层目录结构 + 文件名，必要时读 README / index 类入口文件，**不要读所有源码**。
   - **两者都不存在** → 跳过本步，按纯 brief 驱动生成 spec。

   进入 design-aware 模式时：
   - 把从设计里能看出的功能/交互需求**反向消化进 spec**——典型信号：原型里有的页面、按钮、字段、Tab 切换、列表/详情结构等。
   - spec 必须额外包含 `## 8. 与已有 design 的关系`（见下方结构）。
   - 在 clarify 阶段会自动追问"design 里出现但 brief 没提的功能，是要实施还是参考资料"——本命令不替用户做这个判断。

## 执行步骤

6. **brief.md 中可能包含粗设计意图**（例："我要一个有筛选器的列表页"、"顶栏放搜索框"）。处理原则：
   - 把这些 UI 意图翻译成 spec 的「用户故事 / 使用场景」和功能需求里的「交互要求」（例："用户能按状态筛选订单"）
   - **不要细化到视觉层面**（颜色、字号、组件库选型、像素级布局等），那些留给 /design 阶段
   - 如果 brief 里给出了具体页面名/模块名，在「范围与边界」中显式列出
7. 综合 `$1/brief.md`（本轮新增量）+ `$1/finish.md`（上一轮已有状态，如存在）+ `$1/design.md` 或 `$1/design/`（人手做的设计探索，如存在），生成结构化的 `spec.md`，必须包含以下章节：
   - `# Spec: <功能名称>`
   - `## 0. 上一轮基线`（如存在 finish.md）：一段话概括本轮开工时系统已经处于什么状态，引用 finish.md
   - `## 1. 背景与目标`（业务意图，从 brief 翻译而来）
   - `## 2. 用户故事 / 使用场景`
   - `## 3. 功能需求 (FR)`：使用 `FR-001`、`FR-002` … 编号，每条一句话可验证。**仅描述本轮增量**，不重复上一轮已落地的部分。来源标注（如某条 FR 是从 design/ 反推出来的，标 `[来源: design/path]`）
   - `## 4. 成功标准 (SC)`：使用 `SC-001`、`SC-002` … 编号，可量化
   - `## 5. 范围与边界`（明确 In Scope / Out of Scope；显式标注「本轮只做 X，不动 Y（Y 已在上一轮 finish.md 落地）」）
   - `## 6. 依赖与约束`（包括对 finish.md 中已有数据表/接口/配置的依赖）
   - `## 7. 待澄清事项`：所有不确定的地方用 `[NEEDS CLARIFICATION: <问题>]` 标记。**设计里出现但 brief 没明确的功能，必须在这里加一条澄清问题**（例：`[NEEDS CLARIFICATION: design/auto-gen-system-backend/ 里的 Admin Backend 原型是要实施还是参考资料？]`）
   - `## 8. 与已有 design 的关系`（**仅当进入 design-aware 模式时**）：
     - 设计来源：`design.md` 抽象索引 / `design/` 直接扫描
     - 扫到了哪些页面/模块（按目录或 design.md 第 4 节列）
     - 哪些 FR 来自 design 反推（列 FR 编号）
     - 哪些 design 内容**没有**对应 FR（需要 clarify 决定是否要做）
8. **不要假设、不要猜测**。任何 brief / design 没说清楚的内容，必须用 `[NEEDS CLARIFICATION]` 标出，留给后续 clarify 阶段处理。
9. 写入 `$1/spec.md`。
10. 输出一段简短总结：FR/SC 条目数、`[NEEDS CLARIFICATION]` 数量、是否引用了上一轮 finish、是否消化了已有 design/、文件路径。
11. 末尾提示：
    - 如本次进了 design-aware 模式 → **下一步请运行 `/clarify $1`，并特别留意 design 反推 FR 的澄清**
    - 否则 → **下一步请运行 `/clarify $1`**

## 约束

- 只生成 spec，不要生成 plan、tasks 或代码。
- 不要修改 brief.md / finish.md。
- 输出固定路径 `$1/spec.md`，不要询问用户保存到哪里。
- 链路终点是 `/finish`，它会基于本轮所有产物覆写 `$1/finish.md`，作为下一轮 `/specify` 的上一轮基线。
