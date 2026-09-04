---
description: 把 plan.md 拆解为 tasks.md + analyze.md（Spec-Kit Step 3）
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Tasks + Analyze** 阶段，链路位置：specify → clarify → design → plan → **tasks** → analyze → finish。

## 输入

- `$1`：feature 目录路径（必填）
- 自动读取：`$1/spec.md`
- 自动读取：`$1/plan.md`
- 可选读取：`$1/design.md`（如存在，用来给 UI 类任务生成"视觉参考"字段）

## 输出（两个文件，一起生成、一起提交）

- `$1/tasks.md`（覆盖写入；若目录不存在请先创建）
- `$1/analyze.md`（覆盖写入）

## 前置检查

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/tasks specs/002-MMP-refine-UI`」并停止。
2. `$1/plan.md` 不存在 → 报错并提示先运行 `/plan $1`。
3. `$1/spec.md` 不存在 → 报错并提示先运行 `/specify $1`。

## 执行步骤

### 阶段 A：生成 tasks.md

4. 把 plan 拆成顺序执行的 tasks。**所有 task 写在同一个 tasks.md 里。** 每个 task 必须满足：
   - 改动范围足够小（**改动文件 ≤ 10 个**）
   - 有明确可执行的「验证」步骤（命令或操作）
   - 与某条 FR / 或 plan 的某节有清晰对应关系
5. **识别 UI 类任务**：若任务改动前端代码（页面、组件、样式），必须在任务里加「视觉参考」字段，按 design.md 第 4 节的产物索引指向对应文件。非 UI 任务（后端、数据层、基础设施）省略此字段。
6. 输出格式严格遵循以下模板：

   ```markdown
   # Tasks

   > 来源：$1/plan.md
   > 规则：按顺序执行，未通过验证不得进入下一个 task。
   > UI 类任务实施前必读：design/OVERVIEW.pdf + 对应 screenshots + tokens.css（见每个 UI 任务的「视觉参考」字段）

   ## Task #1: <短标题>
   - **目标**：…
   - **改动文件**：
     - path/to/file1
     - path/to/file2
   - **实现要点**：
     - …
   - **视觉参考**（仅 UI 任务）：
     - **系统全景**：`design/OVERVIEW.pdf`（实施前用 Read 工具多模态看一遍）
     - **本任务对应截图**：`design/screenshots/NN-xxx.png`（Read 工具看图，作为视觉 ground truth）
     - **设计 token**：`design/tokens.css`（颜色/间距/字号严格按 CSS 变量，不要自己估值）
     - **交互参考**（可选）：`design/prototypes/xxx.jsx`
     - **设计意图**：`design/DESIGN_NOTES.md` 的相关节
   - **验证**：
     - 命令：`pnpm …` / `python …`
     - 预期：…
     - UI 任务附加：**人工对比截图，pixel 不一致就改**
   - **对应**：plan §X / FR-XXX

   ## Task #2: …
   ```

7. Task 拆分策略——**按功能纵切，不按技术层横切**：
   - **地基 task**（仅 1-2 个）：项目配置、共享 schema、设计 token、布局组件等所有功能共用的基础设施。做完后应能看到一个空壳站点/框架能跑。
   - **功能 task**（每个 task 是一个完整的用户可见功能）：每个 task 包含该功能所需的 schema + API + 页面/组件，做完后开发人员能在浏览器里看到一个完整的页面或交互。
   - **禁止**按层横切（如"Task 3: 写完所有 API"、"Task 4: 写完所有页面"），这样会导致中间多个 task 完成后没有任何可验证的 UI 产出。
   - 验证标准：**每个 task 做完，开发人员都能在浏览器里看到一个完整的东西**。
8. 写入 `$1/tasks.md`。

### 阶段 B：生成 analyze.md

9. 读取 `$1/spec.md`，提取所有 `FR-XXX` 和 `SC-XXX` 编号。
10. 对 tasks.md 进行机械性比对（详见 `/analyze` 命令定义），生成 `analyze.md`，包含：
    - FR 覆盖矩阵
    - SC 覆盖矩阵
    - plan 元素覆盖（数据表 / 接口 / 配置项）
    - 顺序与依赖问题
    - 粒度问题
    - constitution 合规问题
    - 总结（阻塞性问题数、建议性问题数、结论）
11. 写入 `$1/analyze.md`。

### 阶段 C：总结

12. 输出简短总结：task 总数、是否每个 FR 都有对应 task、UI 类任务是否都填了「视觉参考」、阻塞性问题数。
13. 如存在阻塞性问题，提醒用户先修复再提 PR。
14. 末尾提示：
    - 阻塞问题为 0 → **下一步请按 tasks.md 顺序实施；全部完成且测试通过后运行 `/finish $1` 收口本轮**
    - 有阻塞问题 → **先修复阻塞项，可重跑 `/tasks $1` 或回上游命令调整，再进入实施**

## 约束

- 不要写实现代码。
- 不要修改 plan.md / spec.md / design.md。
- 输出固定路径 `$1/tasks.md` 和 `$1/analyze.md`。
- 单个 task 改动文件超过 10 个时，必须拆成多个 task。
