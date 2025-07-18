# 🚀 GitHub Actions 快速开始示例

## 📋 5分钟快速配置指南

### 步骤 1: 配置 API 密钥（2分钟）

在你的GitHub仓库中设置Secrets：

1. **进入设置页面**
   ```
   你的仓库 → Settings → Secrets and variables → Actions
   ```

2. **添加必需的Secrets**
   
   点击 "New repository secret" 并逐个添加：

   | Secret 名称 | 值 | 获取方法 |
   |------------|---|----------|
   | `DEVTO_API_KEY` | 你的DEV.to API密钥 | [🔗 获取链接](https://dev.to/settings/account) |
   | `HASHNODE_API_KEY` | 你的Hashnode API密钥 | [🔗 获取链接](https://hashnode.com/settings/developer) |
   | `HASHNODE_PUBLICATION_ID` | 你的Publication ID | 从博客URL获取 |

### 步骤 2: 启用 Actions 权限（1分钟）

```
你的仓库 → Settings → Actions → General → Workflow permissions
```

选择：**Read and write permissions** ✅

### 步骤 3: 创建测试表格（1分钟）

在仓库根目录创建 `test-articles.csv`：

```csv
title,description,tags,content,devto_published,hashnode_published
"GitHub Actions自动发布测试","这是一篇测试文章，验证自动发布功能","test,github-actions,automation","# 测试文章

这是通过GitHub Actions自动发布的测试文章。

## 功能验证

- ✅ 表格解析
- ✅ 自动发布  
- ✅ 状态更新

如果你看到这篇文章，说明自动化配置成功！",false,false
```

### 步骤 4: 手动测试发布（1分钟）

1. **前往 Actions 页面**
   ```
   你的仓库 → Actions → "📊 表格批量自动发布"
   ```

2. **点击 "Run workflow"**

3. **配置测试参数**
   ```
   指定表格文件: test-articles.csv
   发布平台: devto (先测试一个平台)
   草稿模式: true (安全的草稿模式)
   强制发布: false
   ```

4. **点击绿色的 "Run workflow" 按钮**

## 🎯 测试验证

### 1. 检查执行结果

- ✅ 工作流执行成功（绿色✓）
- ✅ 在Steps中看到 "📊 表格批量发布报告"
- ✅ 表格文件被自动更新

### 2. 验证平台发布

- ✅ 登录DEV.to检查草稿文章
- ✅ 确认文章内容正确显示

### 3. 检查表格更新

查看 `test-articles.csv` 文件，应该看到：
```csv
title,description,tags,content,devto_published,hashnode_published
"GitHub Actions自动发布测试",...,"test,github-actions,automation",...,"https://dev.to/your-username/article-slug",false
```

## 🔄 进阶配置

### 自动定时发布

工作流已配置每天自动运行3次：
- 🕘 **北京时间 9:00** (UTC 1:00)
- 🕒 **北京时间 15:00** (UTC 7:00)  
- 🕘 **北京时间 21:00** (UTC 13:00)

### 生产环境发布

测试成功后，创建正式的文章表格：

```csv
title,description,tags,content,devto_published,hashnode_published
"我的第一篇自动发布文章","通过GitHub Actions实现自动发布","tech,automation,github","# 我的第一篇自动发布文章

## 介绍

这篇文章是通过GitHub Actions自动发布系统发布的...

## 总结

自动化发布让内容管理变得更高效！",false,false
```

然后手动触发，配置为：
```
指定表格文件: articles.csv
发布平台: devto,hashnode  
草稿模式: false (正式发布)
强制发布: false
```

## 📊 实际使用案例

### 个人博客自动化

```yaml
# 每周发布新文章
1. 周末编辑 weekly-articles.csv
2. 周一自动发布到所有平台
3. 检查发布结果和链接
```

### 团队内容管理

```yaml
# 团队协作流程
1. 内容编辑更新 team-articles.csv
2. 先发布为草稿审核
3. 审核通过后正式发布
4. 自动更新发布状态
```

### 营销内容批量发布

```yaml
# 营销活动自动化
1. 营销团队准备 marketing-articles.csv
2. 按计划自动发布
3. 追踪发布状态和链接
4. 分析发布效果
```

## 🛠️ 常见问题

### Q: 工作流执行失败怎么办？

**A: 检查以下几点**
1. Secrets配置是否正确
2. 表格文件格式是否有问题
3. API密钥是否有效
4. Actions权限是否启用

### Q: 如何修改自动发布时间？

**A: 编辑工作流文件**
```yaml
# 在 .github/workflows/table-auto-publish.yml 中修改
schedule:
  - cron: '0 1,7,13 * * *'  # 自定义时间
```

### Q: 可以只发布到特定平台吗？

**A: 配置平台参数**
```yaml
# 手动触发时在 platforms 参数中指定
platforms: "devto"        # 只发布到DEV.to
platforms: "hashnode"     # 只发布到Hashnode  
platforms: "devto,hashnode" # 发布到两个平台
```

### Q: 如何暂停自动发布？

**A: 禁用工作流**
```yaml
# 方法1: 在Actions页面禁用工作流
Actions → 选择工作流 → Disable workflow

# 方法2: 注释掉schedule部分
# schedule:
#   - cron: '0 1,7,13 * * *'
```

## 🎉 恭喜！

你已经成功配置了GitHub Actions自动发布功能！

### 🚀 下一步

- 📚 阅读完整指南：[GitHub Actions表格发布自动化指南.md](GitHub_Actions_表格发布自动化指南.md)
- 📋 查看表格使用：[表格发布使用指南.md](表格发布使用指南.md)
- 🔧 了解项目功能：[README.md](README.md)

**�� 开始享受全自动的文章发布体验吧！** 