# 多平台文章自动发布工具

一个支持将文章自动发布到多个技术平台的命令行工具，支持 Hashnode、DEV.to、Medium（限制）和 Hacker News（半自动）。

## 🚀 功能特性

- ✅ **多平台支持**: 同时发布到多个平台
- ✅ **Markdown支持**: 原生支持Markdown格式和Front Matter
- ✅ **表格批量发布**: 支持CSV/Excel文件批量管理文章 🆕
- ✅ **GitHub Actions自动化**: 支持定时和手动触发的全自动发布 🆕
- ✅ **智能发布**: 自动检测重复文章，支持更新已有文章
- ✅ **批量处理**: 支持批量发布多个文章
- ✅ **状态追踪**: 自动追踪各平台发布状态 🆕
- ✅ **错误处理**: 完善的错误处理和重试机制
- ✅ **中文支持**: 完整的中文界面和文档

## 📋 平台支持状态

| 平台 | 状态 | 支持功能 | 获取API密钥 |
|------|------|----------|-------------|
| **DEV.to** | ✅ 完全支持 | 发布、更新、草稿 | [获取API Key](https://dev.to/settings/account) |
| **Hashnode** | ✅ 完全支持 | 发布、更新、草稿 | [获取API Key](https://hashnode.com/settings/developer) |
| **Medium** | ❌ 新用户不可用 | 不再支持新集成 | 已停止新用户申请 |
| **Hacker News** | ⚠️ 半自动 | 生成提交链接 | 需要账号密码 |

## 🛠️ 安装和配置

### 1. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd multi-platform-article-publisher

# 安装依赖
npm install

# 可选：如果需要Hacker News浏览器自动化
npm install puppeteer
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量文件
nano .env
```

### 3. 获取API密钥

#### DEV.to API密钥
1. 登录 [DEV.to](https://dev.to)
2. 前往 `Settings → Account → API Keys`
3. 生成新的API Key
4. 将密钥添加到 `.env` 文件

#### Hashnode API密钥
1. 登录 [Hashnode](https://hashnode.com)
2. 前往 `Settings → Developer → API Keys`
3. 生成Personal Access Token
4. 获取Publication ID（从博客URL中提取）
5. 将密钥和ID添加到 `.env` 文件

## 📝 文章格式

### 标准Markdown + Front Matter格式

```markdown
---
title: "你的文章标题"
description: "文章描述，会用作摘要"
tags: ["javascript", "webdev", "tutorial"]
published: true
cover_image: "https://example.com/cover.jpg"
canonical_url: "https://yourblog.com/article"
series: "JavaScript进阶系列"
---

# 文章内容

这里是你的Markdown内容...

## 章节标题

更多内容...
```

### Front Matter字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 文章标题 |
| `description` | string | ❌ | 文章描述/摘要 |
| `tags` | array/string | ❌ | 标签列表 |
| `published` | boolean | ❌ | 是否发布（默认true） |
| `cover_image` | string | ❌ | 封面图片URL |
| `canonical_url` | string | ❌ | 原文链接 |
| `series` | string | ❌ | 系列名称 |

## 🚀 使用方法

### 方式一：传统Markdown文件发布

#### 单篇文章发布

```bash
# 发布单篇文章
node src/publisher.js articles/my-article.md

# 发布为草稿
node src/publisher.js articles/my-article.md --draft

# 使用npm script
npm run publish articles/my-article.md
```

#### 批量发布

```bash
# 发布目录中的所有文章
node src/publisher.js articles/

# 批量发布时添加延迟（避免API限制）
node src/publisher.js articles/ --delay 3000
```

### 方式二：表格批量发布 🆕

#### 创建表格模板

```bash
# 生成Excel模板文件
npm run create-template

# 模板位置：templates/articles-template.xlsx
# 模板位置：templates/articles-template.csv
```

#### 表格发布命令

```bash
# 基本发布（发布未发布的文章）
npm run table-publish articles.csv

# 草稿模式发布（推荐先测试）
npm run table-publish-draft articles.xlsx

# 强制发布所有文章
npm run table-publish-force articles.csv

# 高级选项
node table-publisher.js articles.csv --draft --yes --force-all
```

#### 表格格式要求

| 列名 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `title` | 文本 | ✅ | 文章标题 |
| `description` | 文本 | ❌ | 文章描述 |
| `tags` | 文本 | ❌ | 标签列表（逗号分隔） |
| `content` | 文本 | ❌ | 文章内容（Markdown） |
| `file_path` | 文本 | ❌ | 外部Markdown文件路径 |
| `devto_published` | 布尔值/URL | ❌ | DEV.to发布状态 |
| `hashnode_published` | 布尔值/URL | ❌ | Hashnode发布状态 |

📚 **详细说明**: 查看 [表格发布使用指南.md](表格发布使用指南.md)

### 方式三：GitHub Actions 自动化发布 🆕

#### 配置自动化

```bash
# 1. 配置GitHub Secrets
# Settings > Secrets and variables > Actions
# 添加: DEVTO_API_KEY, HASHNODE_API_KEY, HASHNODE_PUBLICATION_ID

# 2. 启用Actions权限
# Settings > Actions > General > Workflow permissions
# 选择: Read and write permissions
```

#### 自动化功能

- **⏰ 定时发布**: 每天自动检查和发布（北京时间 9:00, 15:00, 21:00）
- **🔄 手动触发**: 支持在Actions页面手动触发并配置参数
- **📊 状态更新**: 发布后自动更新表格状态并提交到仓库
- **📈 详细报告**: 每次执行后生成完整的发布报告

#### 使用方法

```bash
# 在GitHub仓库页面
1. 前往 Actions 页面
2. 选择 "📊 表格批量自动发布"
3. 点击 "Run workflow"
4. 配置参数并执行

# 支持的参数
- 指定表格文件: articles.csv
- 发布平台: devto,hashnode  
- 草稿模式: true/false
- 强制发布: true/false
```

🤖 **详细配置**: 查看 [GitHub Actions表格发布自动化指南.md](GitHub_Actions_表格发布自动化指南.md)

### 高级选项

```bash
# 所有可用选项
node src/publisher.js <文章路径> [选项]

选项:
  --delay <ms>     批量发布时的延迟时间（毫秒）
  --draft          发布为草稿
  --force-new      强制创建新文章（不检查重复）
  --debug          启用调试模式
```

## 📊 发布结果示例

```
✓ 文章解析成功: JavaScript异步编程完全指南

✓ DEV.to 发布成功: https://dev.to/username/javascript-async-guide
✓ Hashnode 发布成功: https://yourblog.hashnode.dev/javascript-async-guide
⚠ 跳过 Hacker News（未配置API密钥）

📊 发布结果摘要:
══════════════════════════════════════════════════
✅ 成功发布:
   • DEV.to: https://dev.to/username/javascript-async-guide
   • Hashnode: https://yourblog.hashnode.dev/javascript-async-guide

总计: 2 成功, 0 失败

🎉 所有发布任务已完成！
```

## 🔧 开发和扩展

### 项目结构

```
example-implementation/
├── src/
│   ├── publisher.js              # 主发布器
│   ├── tablePublisher.js         # 表格发布器 🆕
│   ├── utils/                    # 工具模块 🆕
│   │   ├── tableParser.js        # 表格解析器
│   │   └── tableUpdater.js       # 表格更新器
│   └── publishers/
│       ├── devto.js              # DEV.to发布器
│       ├── hashnode.js           # Hashnode发布器
│       └── hackernews.js         # Hacker News发布器
├── templates/                    # 表格模板 🆕
│   ├── articles-template.csv
│   └── articles-template.xlsx
├── articles/                     # 示例文章目录
├── table-publisher.js            # 表格发布入口 🆕
├── package.json                  # 项目依赖
├── env.example                   # 环境变量模板
└── README.md                     # 项目文档
```

### 添加新平台支持

1. 在 `src/publishers/` 中创建新的平台发布器
2. 实现标准的发布接口：
   ```javascript
   async function publishToPlatform(article, config, options) {
     // 实现发布逻辑
     return {
       success: true,
       id: 'article_id',
       url: 'article_url',
       platform: 'Platform Name',
       data: {}
     };
   }
   ```
3. 在主发布器中注册新平台

### API限制和最佳实践

| 平台 | 请求限制 | 建议延迟 | 注意事项 |
|------|----------|----------|----------|
| DEV.to | 无官方限制 | 1-2秒 | 注意内容质量 |
| Hashnode | 无官方限制 | 1-2秒 | GraphQL查询复杂度 |
| Medium | - | - | 新用户不可用 |
| Hacker News | - | - | 需要手动或自动化 |

## 🧪 测试功能

### 测试表格发布功能

```bash
# 运行表格功能验证测试
node test-table-validation.js

# 测试特定表格文件
node table-publisher.js test-table.csv --draft --yes
```

## ⚠️ 注意事项

### Medium平台
- Medium已停止为新用户提供Integration Token
- 现有用户的token仍可继续使用
- 建议寻找替代方案或手动发布

### Hacker News平台
- 没有官方API支持文章提交
- 提供了浏览器自动化方案（需要Puppeteer）
- 建议使用生成的提交链接手动提交

### 内容质量
- 确保文章内容原创且高质量
- 不同平台的受众特点不同，适当调整内容
- 遵守各平台的社区规则和发布指南

### 表格发布注意事项 🆕
- 确保表格文件使用UTF-8编码
- 支持中英文列名
- 系统会自动备份原始文件
- 建议先用草稿模式测试

## 🔗 相关资源

- [DEV.to API文档](https://developers.forem.com/api/)
- [Hashnode API文档](https://apidocs.hashnode.com/)
- [表格发布使用指南](表格发布使用指南.md) 🆕
- [GitHub Actions表格发布自动化指南](GitHub_Actions_表格发布自动化指南.md) 🆕
- [GitHub Actions语法说明](GitHub_Actions_语法说明.md) 🆕
- [POSSE概念介绍](https://indieweb.org/POSSE)
- [GitHub Actions官方文档](https://docs.github.com/en/actions)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📞 支持

如果遇到问题，请：
1. 查看文档和FAQ
2. 运行测试验证功能: `node test-table-validation.js`
3. 搜索已有的Issues
4. 创建新的Issue并提供详细信息

---

**Happy Publishing! 🚀** 