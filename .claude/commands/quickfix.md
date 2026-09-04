---
description: 轻量修复/小功能：brief → 直接写代码 → finish 收口（跳过 clarify/plan/tasks/analyze）
argument-hint: <feature 目录路径，如 specs/payload-002-gp/payload-002i-timeout-fix>
---

你正在执行 Spec-Kit 工作流的 **Quickfix** 模式，这是完整链路的精简版，适用于小修复和小功能。

## 适用场景

- 改动范围清晰、不超过 2-3 个文件
- 不涉及新建 Collection 或新增外部依赖
- 10-30 分钟能做完 + 验完
- 典型例子：加个字段、改个 hook 逻辑、调整常量、写个小脚本、修个 bug

**不适用**：新建 Collection、接入新服务、跨 3+ 文件重构 → 用完整 spec-kit。

## 输入

- `$1`：feature 目录路径（必填）。如果目录不存在则创建。
- `$1/brief.md`：**必须存在或由用户口述后生成**。
- `$1/finish.md`：上一轮的基线（可选）。
- `constitution.md`（如存在则必读）。

## 流程（3 步）

### Step 1：读 brief，确认范围

1. 读取 `$1/brief.md`（如不存在，根据用户口述生成一份简短的 brief.md，3-10 行即可）。
2. 如果存在 `$1/finish.md`，读取作为上下文。
3. 如果存在 `constitution.md`，读取确保不冲突。
4. **输出确认**：一段话概括要做什么 + 改哪些文件 + 怎么验证。等用户确认后再动手。

### Step 2：写代码

1. 用户确认后，直接读代码、改代码、测试。
2. 改动过程中保持正常的工具使用（Read → Edit / Write）。
3. 改完后简要说明做了什么。

### Step 3：写 finish.md 收口

改完并验证后，生成 `$1/finish.md`，格式精简：

```markdown
# Quickfix: <一句话标题>

> 日期：YYYY-MM-DD
> 模式：quickfix（轻量修复，跳过 clarify/plan/tasks/analyze）

## 做了什么
- 逐条列出改动（文件 + 改了什么 + 为什么）

## 验证
- 怎么验的 + 结果

## 遗留
- 有则列，无则写「无」
```

## 约束

- **不生成** spec.md / clarify.md / plan.md / tasks.md / analyze.md。
- brief.md 可以很短（3-10 行），不需要完整的 §1-§13 结构。
- finish.md 也精简，不需要完整链路的 §1-§7 结构。
- 如果做着做着发现范围超出预期（要改 5+ 个文件、需要 migration、需要新 Collection），**立即停下来**，告诉用户「这个超出 quickfix 范围了，建议切到完整 spec-kit」。
- 链路终点仍然是 finish.md，确保下一轮 `/specify` 能读到这次改了什么。
