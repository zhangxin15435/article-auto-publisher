# 🚀 GitHub快速设置指南

## 📋 第一步：创建GitHub仓库

1. **登录GitHub** → 点击右上角 "+" → "New repository"

2. **仓库设置**：
   ```
   Repository name: article-auto-publisher
   Description: 🤖 自动化文章发布工具 - 支持DEV.to和Hashnode多平台发布
   Visibility: Private (推荐)
   ❌ 不要勾选 "Add a README file"
   ```

3. **点击 "Create repository"**

## 📋 第二步：推送代码到GitHub

复制GitHub给出的命令，或者使用以下命令：

```bash
# 如果还没有添加远程仓库
git remote add origin https://github.com/你的用户名/article-auto-publisher.git

# 推送代码
git branch -M main
git push -u origin main
```

## 📋 第三步：配置GitHub Secrets

进入仓库 → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 🔑 必需的API密钥：

| Secret名称 | 值 |
|------------|-----|
| `DEVTO_API_KEY` | `j8msWWn7cCbwVQBQozyDtgyr` |
| `HASHNODE_API_KEY` | `3afaec8b-4377-4aa6-a4e4-45a524ab656d` |
| `HASHNODE_PUBLICATION_ID` | `687631645e462998e973a89d` |

## 📋 第四步：启用GitHub Actions

1. **进入Actions页面** → 点击 `Actions` 标签
2. **启用Actions** → 点击 "I understand my workflows, go ahead and enable them"
3. **设置权限** → `Settings` → `Actions` → `General`：
   - ✅ "Allow all actions and reusable workflows"
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

## 📋 第五步：测试自动发布

1. **手动测试**：
   - `Actions` → "🤖 自动CSV内容发布" → `Run workflow`
   - 选择 `dry_run: true` 进行测试

2. **查看自动发布时间**：
   - 🌅 06:00 (北京时间)
   - 🌞 12:00 (北京时间)  
   - 🌆 18:00 (北京时间)
   - 🌙 24:00 (北京时间)

## ✅ 设置完成！

系统将每天自动发布4次，每次选择一篇未发布的文章同时发布到DEV.to和Hashnode！

### 📊 监控发布状态

- **Actions页面**：查看每次执行日志
- **发布链接**：在执行日志中找到发布的文章链接
- **备份文件**：自动创建的时间戳备份文件

### 🔄 添加新文章

1. 将Markdown文件放入 `articles/` 目录
2. 在CSV文件中添加记录：
   ```csv
   "文章标题","描述","标签","文件名.md",false,false,"作者"
   ```
3. 推送到GitHub，系统会自动发布！ 