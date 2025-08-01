# 🚀 GitHub自动发布部署指南

## 📋 概述

本指南将帮你将文章自动发布系统部署到GitHub，实现每天4次自动发布（北京时间6:00、12:00、18:00、24:00）。

## 🔧 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub，点击右上角的"+"号，选择"New repository"
2. 填写仓库信息：
   - **Repository name**: `article-auto-publisher` (或其他名称)
   - **Description**: `🤖 自动化文章发布工具 - 支持DEV.to和Hashnode多平台发布`
   - **Visibility**: Private (推荐，因为包含发布配置)
3. **不要**勾选"Add a README file"（我们已经有了）
4. 点击"Create repository"

### 2. 本地Git初始化和推送

在项目根目录执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "🎉 初始提交：自动文章发布系统

✨ 功能特性:
- 🤖 CSV + Markdown 工作流程  
- 📝 智能去除正文重复标题
- 🚀 多平台发布 (DEV.to + Hashnode)
- 🗑️ 自动清理已发布记录
- ⏰ 定时自动发布 (每天4次)
- 💾 自动备份机制"

# 添加远程仓库（替换为你的仓库URL）
git remote add origin https://github.com/你的用户名/article-auto-publisher.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

### 3. 配置GitHub Secrets

1. 在GitHub仓库页面，点击 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret` 添加以下secrets：

#### 必需的API密钥

| Secret名称 | 值 | 说明 |
|------------|----|----|
| `DEVTO_API_KEY` | `j8msWWn7cCbwVQBQozyDtgyr` | DEV.to API密钥 |
| `HASHNODE_API_KEY` | `3afaec8b-4377-4aa6-a4e4-45a524ab656d` | Hashnode API密钥 |
| `HASHNODE_PUBLICATION_ID` | `687631645e462998e973a89d` | Hashnode Publication ID |

#### 可选配置

| Secret名称 | 推荐值 | 说明 |
|------------|--------|------|
| `DEFAULT_PUBLISH_DELAY` | `3000` | 平台间发布延迟(毫秒) |
| `DEBUG` | `false` | 调试模式 |

### 4. 启用GitHub Actions

1. 在仓库页面点击 `Actions` 标签
2. 如果看到提示启用Actions，点击 `I understand my workflows, go ahead and enable them`
3. 确保在 `Settings` → `Actions` → `General` 中：
   - ✅ 选择 "Allow all actions and reusable workflows"
   - ✅ 选择 "Read and write permissions"
   - ✅ 勾选 "Allow GitHub Actions to create and approve pull requests"

### 5. 验证自动发布工作流

#### 手动测试

1. 进入 `Actions` 页面
2. 选择 "🤖 自动CSV内容发布" 工作流
3. 点击 `Run workflow` → 选择测试模式 → `Run workflow`
4. 查看执行日志验证配置

#### 查看定时任务

自动发布时间表（北京时间）：
- 🌅 **06:00** - 早间发布
- 🌞 **12:00** - 午间发布  
- 🌆 **18:00** - 晚间发布
- 🌙 **24:00** - 深夜发布

## 📁 文件准备

### CSV文件格式

在 `articles/` 目录创建CSV文件：

```csv
title,description,tags,file_path,devto_published,hashnode_published,author
"文章标题","文章描述","tag1,tag2,tag3","article.md",false,false,"作者名称"
```

### Markdown文件

将文章内容保存为MD文件，支持frontmatter：

```markdown
---
title: Article Title
description: Article description
tags: [tag1, tag2, tag3]
author: Author Name
---

# Article Title

Article content goes here...
```

## 🔄 工作流程

1. **内容准备**: 将Markdown文件放入 `articles/` 目录
2. **配置CSV**: 在CSV中添加文章记录
3. **推送代码**: `git push` 触发更新
4. **自动发布**: GitHub Actions按计划执行
5. **自动清理**: 发布成功后自动删除记录

## 📊 监控和日志

### Actions页面监控

- 查看每次执行的详细日志
- 监控发布成功/失败状态
- 查看发布的文章链接

### 发布报告

每次执行会生成详细报告：
- ✅ 成功发布的文章和链接
- ❌ 失败原因和建议
- 📊 平台配置状态
- 🗑️ 清理记录统计

## 🛠️ 故障排除

### 常见问题

1. **API密钥错误**
   - 检查GitHub Secrets配置
   - 验证API密钥有效性

2. **权限问题**
   - 确保Actions有写入权限
   - 检查API密钥权限范围

3. **文件格式错误**
   - 确保CSV文件UTF-8编码
   - 检查MD文件格式正确

4. **定时任务不执行**
   - GitHub Actions免费账户有使用限制
   - 检查仓库是否为私有（可能需要付费）

### 调试模式

使用手动触发的测试模式：
1. Actions → 选择工作流 → Run workflow
2. 选择 `dry_run: true`
3. 查看详细日志排查问题

## 📈 扩展功能

- 🔗 添加更多发布平台
- 📧 发布通知邮件
- 📱 Webhook集成
- 📊 发布统计分析

## ⚠️ 注意事项

1. **API限制**: 注意各平台的API调用频率限制
2. **内容质量**: 确保发布内容质量和合规性
3. **备份重要**: 定期备份CSV文件和Markdown内容
4. **安全性**: 保护好API密钥，不要泄露到公开代码中

## 🎉 完成部署

部署完成后，系统将自动：
- ⏰ 按时执行发布任务
- 🤖 智能选择未发布内容
- 🚀 同时发布到多个平台
- 🗑️ 自动清理已发布记录
- 💾 创建完整的备份文件

**享受自动化发布的便利！** 🚀 