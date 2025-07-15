# Hashnode 自动发布工具 - 快速启动指南

## 🚀 快速开始

### 1. 运行初始配置
```bash
npm run setup
```

这会创建一个临时的 `.env` 配置文件并显示详细的设置说明。

### 2. 在 Hashnode 上创建博客

1. 访问 [Hashnode](https://hashnode.com)
2. 登录您的账户
3. 点击 "Create Blog" 创建博客
4. 填写博客信息（名称、域名、描述）

### 3. 获取 Publication ID

创建博客后：
1. 进入博客的仪表板
2. 查看浏览器地址栏 URL：`https://hashnode.com/[PUBLICATION_ID]/dashboard`
3. 复制方括号中的 Publication ID

### 4. 更新配置文件

编辑 `.env` 文件，将 `YOUR_PUBLICATION_ID_HERE` 替换为实际的 Publication ID：

```env
HASHNODE_PUBLICATION_ID=your_actual_publication_id_here
```

### 5. 测试发布功能

```bash
npm run test-publish
```

这会创建一篇测试草稿文章来验证配置是否正确。

## 📝 使用方法

### 发布单篇文章
```bash
# 发布文章（直接发布）
npm run publish articles/your-article.md

# 发布为草稿
npm run publish-draft articles/your-article.md
```

### 发布文章到草稿
```bash
node src/publisher.js articles/your-article.md --draft
```

### 批量发布目录中的所有文章
```bash
npm run publish articles/
```

## 📄 文章格式要求

文章需要包含 Front Matter（YAML 头部）：

```markdown
---
title: "您的文章标题"
description: "文章描述"
tags: ["javascript", "nodejs", "tutorial"]
published: true
cover_image: "https://example.com/image.jpg"
canonical_url: "https://yourblog.com/original-url"
---

# 文章内容

这里是您的文章正文...
```

### Front Matter 字段说明

- `title` (必需): 文章标题
- `description` (可选): 文章描述
- `tags` (可选): 标签数组
- `published` (可选): 是否发布，默认为 true
- `cover_image` (可选): 封面图片 URL
- `canonical_url` (可选): 原文链接

## 🛠 可用脚本命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 运行初始配置向导 |
| `npm run test-publish` | 测试发布功能 |
| `npm run publish <file>` | 发布文章 |
| `npm run publish-draft <file>` | 发布为草稿 |

## 🔧 高级选项

### 发布选项

```bash
# 发布为草稿
node src/publisher.js articles/article.md --draft

# 批量发布时添加延迟（避免API限制）
node src/publisher.js articles/ --delay 3000
```

### 环境变量

在 `.env` 文件中可以配置：

```env
# Hashnode 配置
HASHNODE_API_KEY=your_api_key
HASHNODE_PUBLICATION_ID=your_publication_id

# 其他配置
DEFAULT_PUBLISH_DELAY=2000
DEBUG=true
TIMEZONE=Asia/Shanghai
ARTICLES_DIR=./articles
LOG_LEVEL=info
```

## ❗ 故障排除

### 常见错误及解决方案

1. **"找不到 HASHNODE_API_KEY"**
   - 确保 `.env` 文件存在
   - 检查 API Key 是否正确配置

2. **"HASHNODE_PUBLICATION_ID 未配置"**
   - 确保已将占位符替换为实际的 Publication ID
   - 验证 Publication ID 格式正确

3. **"API密钥无效"**
   - 检查 API Key 是否过期
   - 重新生成 API Key

4. **"没有权限访问该Publication"**
   - 确认 Publication ID 是否正确
   - 确保您有该博客的写入权限

### 获取帮助

如果遇到问题：
1. 运行 `npm run test-publish` 进行诊断
2. 检查 `.env` 文件配置
3. 查看详细错误信息
4. 确认网络连接正常

## 🎉 成功案例

成功配置后，您应该能看到类似的输出：

```
🎉 测试发布成功!
==============================
文章ID: 507f1f77bcf86cd799439011
状态: draft
平台: Hashnode
Slug: test-article-2024-01-01

✅ Hashnode 自动发布功能正常工作!
```

现在您可以开始自动发布文章到 Hashnode 了！ 