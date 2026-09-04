---
description: 检查 tasks 对照 spec/plan 的机械性遗漏（Spec-Kit Step 3 强制环节）
argument-hint: <feature 目录路径>
---

你正在执行 Spec-Kit 工作流的 **Analyze** 阶段，链路位置：specify → clarify → design → plan → tasks → **analyze** → finish。

> 用途：analyze 能发现 tasks 里机械性遗漏的 FR/SC 条目，但**无法发现 spec 本身对 brief 的理解偏差**——后者由人工在 spec 阶段把关。
> 通常 `/tasks` 已经把 analyze.md 一并产出了。本命令用于 **tasks 实施过程中或之后**，需要重新校验时单独跑。

## 输入

- `$1`：feature 目录路径（必填）
- 自动读取：`$1/spec.md`
- 自动读取：`$1/plan.md`
- 自动读取：`$1/tasks.md`

## 输出

- 写入文件：`$1/analyze.md`（覆盖写入；若目录不存在请先创建）

## 前置检查

1. `$1` 为空 → 报错：「请传入 feature 目录路径，例：`/analyze specs/002-MMP-refine-UI`」并停止。
2. 三个输入文件任一不存在，报错并提示先运行对应命令（`/specify $1` / `/plan $1` / `/tasks $1`）。

## 执行步骤

3. 从 `spec.md` 提取所有 `FR-XXX` 和 `SC-XXX` 编号，建立完整清单。
4. 从 `plan.md` 提取所有章节中提到的「数据模型表 / 接口 / 配置项 / 合规要点」。
5. 从 `tasks.md` 提取所有 task 的「对应」字段和「改动文件」。
6. 进行以下机械性比对：
   - **FR 覆盖**：每条 FR 是否至少被一个 task 覆盖？列出未覆盖项。
   - **SC 覆盖**：每条 SC 是否在某个 task 的「验证」中可被检验？列出未覆盖项。
   - **plan 覆盖**：plan 中提到的每张表、每个接口、每个配置项是否都被 tasks 提及？列出遗漏。
   - **顺序合理性**：是否存在「先用后建」的依赖倒置？
   - **粒度检查**：是否有 task 的改动文件 > 10 个？
   - **PR 标题规范**：是否每个 task 都有 PR 标题？
   - **constitution 合规**：tasks 是否引入 plan 中没有的、且违反 constitution 的内容？
7. 生成 `analyze.md`，结构如下：

   ```markdown
   # Analyze: <功能名称>

   > 输入：$1/spec.md、$1/plan.md、$1/tasks.md
   > 性质：机械性遗漏检查，不替代业务审查。

   ## 1. FR 覆盖矩阵
   | FR | 出现在 task | 状态 |
   | --- | --- | --- |
   | FR-001 | Task #2, #5 | ✅ |
   | FR-002 | — | ❌ 缺失 |

   ## 2. SC 覆盖矩阵
   | SC | 验证 task | 状态 |

   ## 3. plan 元素覆盖
   - 数据表：…
   - 接口：…
   - 配置项：…

   ## 4. 顺序与依赖问题
   ## 5. 粒度问题
   ## 6. PR 标题 / 规范问题
   ## 7. constitution 合规问题
   ## 8. 总结
   - 阻塞性问题数：N
   - 建议性问题数：N
   - **结论**：✅ 可提 PR / ❌ 必须先修 tasks
   ```

8. 写入 `$1/analyze.md`。
9. 输出简短总结：阻塞问题数、是否可提 PR。
10. 末尾提示：
    - 阻塞 0、所有 task 已实施且测试通过 → **运行 `/finish $1` 收口本轮，生成 finish.md 作为下轮基线**
    - 仍有阻塞 → **修复阻塞项后再回来**

## 约束

- 不要修改 spec / plan / tasks / design。
- 不要补全缺失项——只报告，由人决定是否回到上一步重跑。
- 输出固定路径 `$1/analyze.md`。
- 存在阻塞性问题时，禁止把 tasks PR 提交，更不能跑 `/finish`。
