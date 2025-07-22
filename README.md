# 🤖 自动CSV内容发布工具

一个支持从CSV文件自动发布文章到多个技术平台的工具，支持 DEV.to 和 Hashnode 平台。

## ✨ 核心功能

- 🤖 **自动化发布**: 每天定时自动从CSV文件选择未发布内容进行发布
- 🗑️ **智能清理**: 发布成功后自动删除已发布内容，避免重复发布
- 🎯 **多平台支持**: 同时发布到 DEV.to、Hashnode 和 Medium
- ⏰ **定时执行**: 每天6点、18点、12点、24点自动执行
- 📊 **状态追踪**: 智能跟踪发布状态，避免重复发布

## 🚀 快速开始

### 1. 安装依赖

```bash
# 使用pnpm安装依赖（推荐）
pnpm install

# 或使用npm
npm install
```

### 2. 配置API密钥

复制环境变量模板：
```bash
cp env.example .env
```

编辑 `.env` 文件，添加你的API密钥：
```env
# DEV.to 配置
DEVTO_API_KEY=your_devto_api_key_here

# Hashnode 配置  
HASHNODE_API_KEY=your_hashnode_api_key_here
HASHNODE_PUBLICATION_ID=your_publication_id_here

# Medium 配置
MEDIUM_COOKIES=your_medium_cookies_here
```

#### 获取API密钥

**DEV.to API密钥**：
1. 登录 [DEV.to](https://dev.to)
2. 前往 `Settings → Account → API Keys`
3. 生成新的API Key

**Hashnode API密钥**：
1. 登录 [Hashnode](https://hashnode.com)
2. 前往 `Settings → Developer → API Keys`
3. 生成Personal Access Token
4. 获取Publication ID（从博客URL中提取）

**Medium Cookies**：
1. 登录 [Medium](https://medium.com)
2. 运行Cookie提取工具：`npm run extract-medium-cookies`
3. 按照工具指导从浏览器提取Cookies

### 3. 准备CSV文件

在 `articles` 目录下创建CSV文件，格式如下：

```csv
title,description,tags,content,devto_published,hashnode_published,medium_published
"文章标题","文章描述","tag1,tag2,tag3","# 文章内容\n\n这里是正文...",false,false,false
```

**必需字段**：
- `title`: 文章标题
- `content`: 文章内容（支持Markdown格式）

**可选字段**：
- `description`: 文章描述
- `tags`: 标签（逗号分隔）
- `devto_published`: DEV.to发布状态
- `hashnode_published`: Hashnode发布状态

### 4. 本地测试

```bash
# 手动执行一次发布
npm run auto-csv-publish
```

### 5. 配置GitHub Actions自动发布

1. **上传项目到GitHub仓库**

2. **配置GitHub Secrets**：
   - 前往仓库的 `Settings → Secrets and variables → Actions`
   - 添加以下Secrets：
     - `DEVTO_API_KEY`: 你的DEV.to API密钥
     - `HASHNODE_API_KEY`: 你的Hashnode API密钥
     - `HASHNODE_PUBLICATION_ID`: 你的Hashnode Publication ID
     - `MEDIUM_COOKIES`: 你的Medium登录Cookies

3. **启用GitHub Actions**：
   - 确保在 `Settings → Actions → General` 中启用了Actions
   - 选择 "Read and write permissions"

4. **自动发布时间**：
   - 每天北京时间 6:00、18:00、12:00、24:00 自动执行
   - 每次执行会选择一篇未发布的内容进行发布
   - 发布成功后自动删除该条记录

## 📖 使用方法

### 本地使用

```bash
# 自动发布CSV中的未发布内容
npm run auto-csv-publish

# 传统Markdown文件发布
npm run publish articles/my-article.md
npm run publish-draft articles/my-article.md

# 生成CSV模板
npm run create-template
```

### GitHub Actions使用

1. **自动执行**: 系统会在设定时间自动运行，无需手动操作

2. **手动触发**: 
   - 前往仓库的 `Actions` 页面
   - 选择 "🤖 自动CSV内容发布" 工作流
   - 点击 "Run workflow"
   - 可选择测试模式进行调试

3. **查看结果**: 
   - 在Actions页面查看执行日志
   - 系统会生成详细的发布报告
   - 成功发布的内容会自动从CSV文件中删除

## 📝 文章格式

### CSV格式
```csv
title,description,tags,content,devto_published,hashnode_published
"JavaScript异步编程","深入理解Promise和async/await","javascript,async","# JavaScript异步编程\n\n## Promise基础\n\n...",false,false
```

### Markdown格式（传统方式）
```markdown
---
title: "你的文章标题"
description: "文章描述"
tags: ["javascript", "tutorial"]
published: true
---

# 文章内容

这里是你的Markdown内容...
```

## 🔧 项目结构

```
article-auto-publisher/
├── .github/workflows/
│   └── auto-csv-publish.yml      # GitHub Actions工作流
├── articles/                     # CSV文件存放目录
│   └── sample-articles.csv       # 示例文章
├── scripts/
│   ├── auto-csv-publisher.js     # 自动CSV发布脚本
│   ├── github-actions-publish.js # GitHub Actions发布脚本
│   └── setup-github-secrets.js   # GitHub Secrets配置指南
├── src/
│   ├── publisher.js              # 传统Markdown发布器
│   ├── utils/                    # 工具模块
│   └── publishers/               # 平台发布器
├── templates/
│   └── create-excel-template.js  # 模板生成器
├── package.json                  # 项目配置
├── env.example                   # 环境变量模板
└── README.md                     # 项目文档
```

## 🎯 工作流程

1. **内容准备**: 将文章内容添加到CSV文件中
2. **自动检测**: GitHub Actions定时扫描CSV文件
3. **选择发布**: 自动选择第一篇未发布的内容
4. **多平台发布**: 同时发布到DEV.to和Hashnode
5. **状态更新**: 记录发布状态和链接
6. **自动清理**: 删除已发布的内容记录
7. **提交变更**: 自动提交更新后的CSV文件

## 🛠️ 高级配置

### 自定义发布时间

编辑 `.github/workflows/auto-csv-publish.yml` 中的cron表达式：
```yaml
schedule:
  - cron: '0 22,10,4,16 * * *'  # UTC时间
```

### 仅发布到特定平台

修改脚本中的平台配置，或在API密钥中只配置需要的平台。

## ❓ 故障排除

1. **API密钥问题**: 确保在GitHub Secrets中正确配置了API密钥
2. **CSV格式错误**: 确保CSV文件包含必需的 `title` 和 `content` 列
3. **权限问题**: 确保GitHub Token有仓库写入权限
4. **编码问题**: 确保CSV文件使用UTF-8编码

## 📜 许可证

MIT License

---

**让内容发布变得简单自动！** 🚀 