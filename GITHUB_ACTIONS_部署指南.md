# GitHub Actions 自动发布部署指南

这个指南将帮助你将文章自动发布功能部署到GitHub Actions，实现定时自动发布到Hashnode和Dev.to平台。

## 📋 功能特性

- ✅ **定时自动发布**: 每天6点、12点、18点、24点自动执行
- ✅ **多平台支持**: 同时发布到Hashnode和Dev.to
- ✅ **手动触发**: 支持手动触发发布，可选择平台和文章
- ✅ **草稿模式**: 支持草稿模式测试
- ✅ **详细日志**: 完整的发布日志和报告
- ✅ **错误处理**: 智能错误处理和通知

## 🚀 快速开始

### 第一步：准备工作

1. **确保项目结构正确**
   ```
   example-implementation/
   ├── .github/
   │   └── workflows/
   │       └── auto-publish.yml
   ├── scripts/
   │   ├── github-actions-publish.js
   │   └── setup-github-secrets.js
   ├── src/
   │   └── publishers/
   ├── articles/
   │   └── *.md
   └── package.json
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

### 第二步：获取API密钥

#### Dev.to API密钥
1. 登录 [Dev.to](https://dev.to)
2. 前往 Settings → Account → API Keys
3. 生成新的API Key
4. 复制并保存密钥

#### Hashnode API密钥
1. 登录 [Hashnode](https://hashnode.com)
2. 前往 Settings → Developer → API Keys  
3. 生成Personal Access Token
4. 复制并保存密钥

#### Hashnode Publication ID
1. 前往你的Hashnode博客首页
2. 查看URL或在设置中查找Publication ID
3. 复制并保存ID

### 第三步：配置GitHub Secrets

1. 前往GitHub仓库页面
2. 点击 **Settings** 选项卡
3. 在左侧菜单选择 **Secrets and variables** → **Actions**
4. 添加以下secrets：

| Secret名称 | 描述 | 必需 |
|-----------|------|------|
| `DEVTO_API_KEY` | Dev.to API密钥 | 是 |
| `HASHNODE_API_KEY` | Hashnode API密钥 | 是 |
| `HASHNODE_PUBLICATION_ID` | Hashnode Publication ID | 是 |

### 第四步：准备文章

1. 将待发布的文章放入 `articles/` 目录
2. 确保文章格式正确（支持Markdown + Front Matter）

示例文章格式：
```markdown
---
title: "我的第一篇文章"
description: "这是一篇测试文章"
tags: ["技术", "教程"]
published: true
cover_image: "https://example.com/image.jpg"
---

# 文章内容

这里是文章正文...
```

### 第五步：推送代码

```bash
git add .
git commit -m "feat: 添加GitHub Actions自动发布功能"
git push origin main
```

## ⚙️ 使用方法

### 自动定时发布

工作流将在以下时间自动执行：
- **北京时间**: 6点、12点、18点、24点
- **UTC时间**: 22点、4点、10点、16点

### 手动触发发布

1. 前往GitHub仓库的 **Actions** 选项卡
2. 选择 "自动发布文章到多平台" 工作流
3. 点击 **Run workflow** 按钮
4. 可选配置：
   - **发布平台**: 选择devto、hashnode或留空发布到所有平台
   - **草稿模式**: 选择是否为草稿模式
   - **指定文章**: 可选择发布特定文章

### 本地测试

在推送到GitHub之前，可以先本地测试：

```bash
# 查看配置指南
node scripts/setup-github-secrets.js

# 测试发布（草稿模式）
node scripts/github-actions-publish.js --draft

# 测试发布到特定平台
node scripts/github-actions-publish.js --platforms=devto --draft

# 测试发布特定文章
node scripts/github-actions-publish.js --file=test-article.md --draft
```

## 📊 监控和日志

### 查看执行状态
1. 前往GitHub仓库的 **Actions** 选项卡
2. 查看最近的工作流执行记录
3. 点击具体执行记录查看详细日志

### 发布报告
每次执行后会生成详细的发布报告，包括：
- 执行信息（时间、触发方式）
- 配置状态（API密钥状态）
- 文章状态（发现的文章列表）
- 发布结果（成功/失败详情）

## 🔧 定制配置

### 修改执行时间

编辑 `.github/workflows/auto-publish.yml` 中的cron表达式：

```yaml
schedule:
  # 每天6点、12点、18点、24点（UTC时间）
  - cron: '0 6,12,18,0 * * *'
```

### 添加更多平台

1. 在 `src/publishers/` 目录添加新的发布器
2. 在 `scripts/github-actions-publish.js` 中添加对应的处理逻辑
3. 更新工作流文件添加新的环境变量

### 自定义发布逻辑

修改 `scripts/github-actions-publish.js` 来自定义：
- 文章筛选逻辑
- 发布顺序
- 错误处理
- 延迟时间

## 🚨 故障排除

### 常见问题

#### 1. API密钥配置错误
**症状**: 工作流显示"未配置"或认证失败
**解决方案**: 
- 检查GitHub Secrets是否正确配置
- 验证API密钥是否有效
- 确认密钥名称拼写正确

#### 2. 文章格式问题
**症状**: 发布失败，显示数据验证错误
**解决方案**:
- 检查文章Front Matter格式
- 确认必需字段（title）存在
- 验证标签数量和格式

#### 3. 网络连接问题
**症状**: 请求超时或连接失败
**解决方案**:
- 检查平台API服务状态
- 重新触发工作流
- 查看详细错误日志

#### 4. 权限问题
**症状**: 403 Forbidden错误
**解决方案**:
- 检查API密钥权限
- 验证Publication ID是否正确
- 确认账号有发布权限

### 调试步骤

1. **检查配置**
   ```bash
   node scripts/setup-github-secrets.js
   ```

2. **本地测试**
   ```bash
   # 创建测试环境变量文件
   cp env.example .env
   # 编辑.env文件，填入API密钥
   
   # 草稿模式测试
   node scripts/github-actions-publish.js --draft
   ```

3. **查看详细日志**
   - 在GitHub Actions页面查看完整执行日志
   - 查看每个步骤的详细输出
   - 检查错误堆栈跟踪

4. **联系支持**
   - 查看平台API文档
   - 检查API状态页面
   - 联系平台技术支持

## 🔐 安全最佳实践

1. **API密钥管理**
   - 使用GitHub Secrets存储敏感信息
   - 定期轮换API密钥
   - 监控API使用情况

2. **权限最小化**
   - 只授予必要的API权限
   - 使用专门的发布账号
   - 避免在代码中硬编码密钥

3. **监控和审计**
   - 定期检查发布日志
   - 监控异常活动
   - 设置错误通知

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/actions)
- [Dev.to API 文档](https://developers.forem.com/api)
- [Hashnode API 文档](https://apidocs.hashnode.com/)
- [Cron 表达式生成器](https://crontab.guru/)

## ❓ 常见问题解答

**Q: 能否只发布到一个平台？**
A: 可以，在手动触发时选择特定平台，或修改脚本默认配置。

**Q: 如何避免重复发布？**
A: 脚本会检查文章标题，如果存在同名文章会跳过或更新。

**Q: 支持定时发布特定文章吗？**
A: 当前不支持，但可以通过修改脚本添加此功能。

**Q: 如何处理发布失败？**
A: 脚本会记录详细错误信息，可以根据日志调试问题。

**Q: 能否自定义发布时间？**
A: 可以，修改workflow文件中的cron表达式即可。

---

🎉 **恭喜！** 你已经成功配置了GitHub Actions自动发布功能。现在你的文章会自动定时发布到多个平台了！ 