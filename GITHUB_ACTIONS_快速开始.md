# GitHub Actions 自动发布 - 快速开始

这是将文章自动发布功能部署到GitHub Actions的快速开始指南。

## 🚀 5分钟快速部署

### 1. 检查项目
```bash
# 确保在正确的目录
cd example-implementation

# 检查项目结构和配置
pnpm run github-test
```

### 2. 获取API密钥

#### Dev.to
1. 访问 https://dev.to/settings/account
2. 滚动到 "API Keys" 部分
3. 生成新的API Key
4. 复制密钥

#### Hashnode
1. 访问 https://hashnode.com/settings/developer
2. 生成 Personal Access Token
3. 复制密钥
4. 获取 Publication ID（从你的博客URL中获取）

### 3. 配置GitHub Secrets

1. 前往你的GitHub仓库
2. Settings → Secrets and variables → Actions
3. 添加以下secrets：
   - `DEVTO_API_KEY`
   - `HASHNODE_API_KEY`
   - `HASHNODE_PUBLICATION_ID`

### 4. 准备文章

将你的文章放入 `articles/` 目录，格式如下：

```markdown
---
title: "我的文章标题"
description: "文章描述"
tags: ["技术", "教程"]
published: true
---

# 文章内容

这里是文章正文...
```

### 5. 推送到GitHub

```bash
git add .
git commit -m "feat: 添加GitHub Actions自动发布"
git push origin main
```

### 6. 测试工作流

1. 前往GitHub仓库的 Actions 页面
2. 选择 "自动发布文章到多平台" 工作流
3. 点击 "Run workflow"
4. 选择 "草稿模式" 进行首次测试

## ⏰ 自动执行时间

工作流将在以下时间自动执行：
- **北京时间**: 每天 6:00、12:00、18:00、24:00
- **UTC时间**: 每天 22:00、4:00、10:00、16:00

## 📋 可用命令

```bash
# 查看GitHub Secrets配置指南
pnpm run github-setup

# 本地测试项目配置
pnpm run github-test

# 本地测试发布（草稿模式）
pnpm run github-publish-draft

# 本地正式发布
pnpm run github-publish

# 发布到特定平台
pnpm run github-publish -- --platforms=devto --draft

# 发布特定文章
pnpm run github-publish -- --file=test.md --draft
```

## ✅ 成功部署的标志

1. ✅ GitHub Actions 工作流出现在 Actions 页面
2. ✅ 手动触发测试工作流成功执行
3. ✅ 在对应平台看到发布的文章（草稿）
4. ✅ 工作流日志显示发布成功

## 🚨 常见问题

**Q: 工作流显示"未配置"？**
A: 检查GitHub Secrets是否正确添加，名称是否完全匹配。

**Q: 发布失败怎么办？**
A: 查看详细的执行日志，通常会显示具体的错误原因。

**Q: 如何修改执行时间？**
A: 编辑 `.github/workflows/auto-publish.yml` 中的 cron 表达式。

**Q: 能否先测试不要正式发布？**
A: 可以，使用草稿模式或在手动触发时选择"draft_mode: true"。

## 📞 获取帮助

- 查看详细文档：`GITHUB_ACTIONS_部署指南.md`
- 运行配置检查：`pnpm run github-test`
- 查看工作流日志获取详细错误信息

---

🎉 **恭喜！** 你的自动发布系统已经准备就绪！ 