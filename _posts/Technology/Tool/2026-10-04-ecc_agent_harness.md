---

layout: post
title: ECC：给 AI 编程助手装一套"工程体系"
category: Technology
tags: Tool
keywords: ECC Claude Code agent harness skills hooks

---

## 简介

[affaan-m/ECC](https://github.com/affaan-m/ECC) 自称 "The agent harness performance optimization system"。它不是一个新的 AI 编程工具，而是一套装在已有 agent harness（Claude Code、Codex、Cursor、OpenCode、Gemini CLI 等）之上的配置与工作流集合：agents、skills、hooks、rules、memory 和安全扫描。

截至 2026-10-04，仓库约 27 万 star、4 万 fork，MIT 协议，当前版本 2.2.3（2026-10-01 发布）。作者的背景是：从 Claude Code 实验阶段就开始使用，2025 年 9 月赢得 Anthropic x Forum Ventures 黑客松，这些配置来自其多个生产项目的实践。

它想解决的问题，一句话概括：

> Optimize the context window. Persist everything else.

模型本身已经能写代码，但"先计划、再写测试、再实现、换个上下文 review、验证、沉淀经验"这套工程流程，每次都要靠 prompt 重新交代，而且模型很容易忘。ECC 的做法是把这套流程一次性装进 harness：

```text
plan -> test -> implement -> review -> verify -> remember -> improve
```

## 组成部分

| 组件 | 数量 | 作用 | 对上下文的影响 |
|---|---:|---|---|
| Agents | 68 | 有独立上下文和工具权限的子代理：planner、architect、code-reviewer、各语言 reviewer / build-resolver 等 | 隔离规划、实现与 review |
| Skills | 293 | 可复用的工作流：TDD、安全审查、研究、前端、数据、ML、运维…… | 按需加载 |
| Commands | 94 | slash 命令入口，迁移期的兼容层 | 显式调用 |
| Rules | 按需选择 | 通用 + 各语言的编码规范 | **始终加载**，所以要挑着装 |
| Hooks | — | 在工具事件上触发的脚本 | 在模型上下文**之外**运行 |
| Instincts | — | 从真实会话中学到的、带置信度的小模式 | 相关时召回 |

这张表是理解 ECC 设计的关键：几类组件的区分，本质上是**按"占用上下文的方式"来划分**的。Rules 始终在上下文里，代价最高；Skills 用到才加载；Hooks 根本不进上下文，是确定性的；Agents 则开一个新的上下文窗口来隔离工作。

### Agents

子代理就是一个带 front matter 的 Markdown 文件，限定了工具和模型：

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer...
```

"写代码的上下文"和"review 代码的上下文"分开，是 ECC 反复强调的一点：同一个上下文自己审自己，容易有盲区。

### Skills

Skills 是 ECC 现在的主要工作流载体，新功能优先放在 `skills/` 里，commands 逐渐退化为入口。以 TDD 为例：

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hooks

Hooks 把"请记得做 X"这类软约束变成确定性检查。例如编辑 JS/TS 文件后检查遗留的 `console.log`：

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

### Rules

```
rules/
  common/          # 通用原则（建议安装）
  typescript/
  python/
  golang/
  ...
```

建议只装 `common` 加上自己真正用的一种语言，因为 rules 每次都会进入上下文。

## 一个典型流程：TDD

```text
/ecc:plan "Add usage-based billing alerts"
  -> 确认或修改计划
  -> 激活 tdd-workflow
  -> 实现前先拿到 RED（失败测试）的证据
  -> 实现直到 GREEN
  -> 在全新上下文中 review
  -> 针对 review 发现补回归测试并修复
  -> 验证 build、lint、类型和测试
```

ECC 的观点是：产出不只是代码，而是一条**证据链**——计划、失败的测试、通过的测试、review 结论、最终验证。

常用入口：

| 场景 | 入口 |
|---|---|
| 开发新功能 | `/ecc:plan "..."`，然后 `tdd-workflow` |
| 修 bug | 先写复现的失败测试，再 `tdd-workflow` |
| review 新代码 | `/code-review` |
| 修构建 | `/build-fix` |
| 清理代码 | `/refactor-clean` |
| 查看上下文压力 | `/context-budget` |
| 结束 / 恢复长会话 | `/save-session`、`/resume-session` |

## 记忆与持续学习

### Continuous Learning v2：Instinct

这是 ECC 里我觉得最有意思的设计。它通过 PreToolUse / PostToolUse hook 观察会话，由后台的小模型（Haiku）分析，提炼出原子化的 "instinct"：

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
scope: project
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
```

几个设计点：

- **原子化**：一个 trigger 对应一个 action，而不是直接生成一个大 skill。
- **置信度**：0.3（试探）到 0.9（几乎确定），随证据累积变化。
- **项目隔离**：v2.1 起 instinct 默认按项目存储（按 git remote / 路径识别），React 项目的习惯不会污染 Python 项目；同一模式在 2 个以上项目出现后才提升为全局。
- **演化**：instincts 聚类后再"进化"成 skill / command / agent。

对比 v1：v1 在 Stop hook（会话结束时）在主上下文里分析，直接产出完整 skill；v2 把分析挪到后台、粒度变小、加了置信度，明显更省上下文也更可控。

### Memory Vault

`ecc memory` 提供一个跨 harness 的本地记忆库：统一的 Markdown 格式（`ecc.memory.v1`），项目记忆在 `.ecc/memory/`，用户记忆在 `~/.ecc/memory/`。可以从一个 harness 写 handoff，另一个 harness 读取：

```bash
ecc memory init --scope project
ecc memory handoff --from hermes --target codex \
  --title "Continue authentication migration" --body-file ./handoff.md
ecc memory search "authentication migration" --target-harness codex
```

值得注意的是它对记忆的定位很克制：**记忆是"未审查的上下文"，不是可执行的策略**。agent 必须对重要结论去权威来源核实，不能把召回内容当指令执行；被认可的知识应该由人提升到正式的项目文档里。

## 安全

ECC 把 harness 本身当作攻击面来看待：hooks 能执行 shell 命令，MCP server 可能持有凭据，项目里的指令文件会进入模型上下文——这三者都应视为"可执行配置"。

- **AgentShield**（`agentshield scan --path .` / `/security-scan`）：扫描 prompts、hooks、MCP 配置、权限、密钥和 agent 文件。
- **GateGuard**：在执行前拦截破坏性 shell 命令（`rm`、强制 `git checkout`、带 `-exec` 的破坏性 `find` 等）。
- **只从官方渠道安装**：README 明确警告第三方镜像可能含恶意代码。考虑到这个项目的热度，这个提醒很有必要。

## 省 token 的建议

README 里有一节很实用的成本建议（针对 Claude Code）：

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

以及：

- 不要一次开太多 MCP，每个工具描述都占上下文——建议每个项目少于 10 个 MCP、80 个工具。
- 在逻辑断点主动 `/compact`（调研完成后、里程碑之间、放弃一个方案之后），不要在实现中途 compact。
- 简单的串行任务用 subagent 比 agent team 更省 token。

## 安装

```bash
# Claude Code：引导式安装
npx ecc-universal@2.2.3 setup

# 或者在 Claude Code 内用原生插件命令
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc

# 不要 hooks 的最小安装
npx ecc-universal@2.2.3 install --profile minimal --target claude
```

插件不能分发 rules，需要手动复制需要的 rule 包到 `~/.claude/rules/ecc/`。

有一点 README 反复强调：**每个 harness 只选一种安装方式**，不要插件安装后再叠加手动安装，否则 skills、hooks 会重复，hooks 甚至会触发两次。

## 小结

ECC 的价值不在于那 293 个 skill 本身，而在于它对"agent 工程化"的一套清晰分层：

1. **按上下文成本划分组件**：始终加载的 rules 要少，按需加载的 skills 可以多，确定性的检查放进 hooks，需要隔离的工作交给子代理。
2. **用流程和证据代替口头约束**：TDD、fresh-context review、验证都是有门禁的步骤，而不是 prompt 里的一句"请注意"。
3. **经验要沉淀，但要可控**：instinct 带置信度、按项目隔离；memory 被当作未审查的数据，而不是指令。
4. **harness 本身也是攻击面**。

需要注意的是它体量很大，全部装上反而会挤占上下文。比较好的用法是从一个工作流（比如 `/ecc:plan` + `tdd-workflow` + `/code-review`）开始，用 `/context-budget` 观察开销，再逐步加。即使不安装，读一读它的 [Shorthand Guide](https://github.com/affaan-m/ECC/blob/main/the-shortform-guide.md)、[Longform Guide](https://github.com/affaan-m/ECC/blob/main/the-longform-guide.md) 和 [Security Guide](https://github.com/affaan-m/ECC/blob/main/the-security-guide.md)，对设计自己的 agent 工作流也很有参考价值。
