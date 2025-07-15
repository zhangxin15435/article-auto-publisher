# 🚀 GitHub 远程仓库推送指南

## 📋 当前状态

✅ Git仓库已初始化  
✅ 所有文件已添加并提交  
✅ 分支已设置为 `main`  
✅ 提供的Token: `ghp_****[已隐藏]****`

## 🔧 推送步骤

### 方法一：创建新仓库（推荐）

#### 第一步：在GitHub上创建新仓库

1. 访问 https://github.com/new
2. 仓库名称建议：`article-auto-publisher` 或 `multi-platform-publisher`
3. 描述：`自动发布文章到多个平台的工具 - 支持Hashnode和Dev.to`
4. 设置为公开或私有（根据需要）
5. **不要**勾选 "Add a README file"（因为我们已有文件）
6. 点击 "Create repository"

#### 第二步：获取仓库URL

创建仓库后，GitHub会显示仓库URL，格式如：
```
https://github.com/你的用户名/仓库名.git
```

#### 第三步：配置远程仓库并推送

替换下面命令中的 `你的用户名` 和 `仓库名`：

```bash
# 添加远程仓库（使用你的GitHub用户名和仓库名）
git remote add origin https://YOUR_TOKEN@github.com/你的用户名/仓库名.git

# 推送代码
git push -u origin main
```

### 方法二：推送到现有仓库

如果你已有仓库，直接运行：

```bash
# 替换为你的实际仓库URL
git remote add origin https://YOUR_TOKEN@github.com/你的用户名/现有仓库名.git
git push -u origin main
```

## 🔐 Token使用说明

### Token格式
```
https://TOKEN@github.com/用户名/仓库名.git
```

### 你的Token
```
ghp_****[已隐藏为安全考虑]****
```

### 完整URL示例
```
https://YOUR_TOKEN@github.com/your-username/article-auto-publisher.git
```

## 📋 一键执行命令

请将以下命令中的 `YOUR_USERNAME` 和 `REPO_NAME` 替换为实际值：

```bash
# 第一步：添加远程仓库
git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/REPO_NAME.git

# 第二步：推送代码
git push -u origin main
```

## ✅ 推送成功后的步骤

1. **配置GitHub Secrets**（重要！）：
   - 前往仓库 Settings → Secrets and variables → Actions
   - 添加之前提取的3个secrets：
     - `DEVTO_API_KEY`: `[你的Dev.to API密钥]`
     - `HASHNODE_API_KEY`: `[你的Hashnode API密钥]`
     - `HASHNODE_PUBLICATION_ID`: `[你的Hashnode Publication ID]`

2. **测试GitHub Actions**：
   - 前往 Actions 页面
   - 手动触发 "自动发布文章到多平台" 工作流
   - 首次建议使用草稿模式

3. **验证自动发布**：
   - 工作流将在每天6点、12点、18点、24点自动执行
   - 检查发布日志和结果

## 🚨 安全提醒

- ✅ Token已正确使用HTTPS格式
- ✅ .env文件已被.gitignore保护
- ⚠️ Token是敏感信息，请妥善保管
- ⚠️ 如果Token泄露，请立即在GitHub设置中撤销并重新生成

## 🆘 常见问题

**Q: 推送时出现认证错误？**
A: 确保Token有正确的权限（repo权限）

**Q: 仓库不存在错误？**
A: 确保GitHub上已创建仓库，且URL中的用户名和仓库名正确

**Q: 如何修改远程仓库？**
A: 使用 `git remote set-url origin 新的URL`

---

🎉 **准备就绪！** 按照上述步骤即可成功推送项目到GitHub并启用自动发布功能！ 