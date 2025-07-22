# 📤 GitHub Actions 表格上传指南

本指南将帮助您将表格文件上传到GitHub，并通过GitHub Actions实现自动发布。

## 🚀 快速开始（5分钟）

### 第1步：准备表格文件

1. **使用中文模板**（推荐）
   ```bash
   # 在本地创建中文模板
   npm run create-chinese-template
   ```
   
2. **或创建自定义CSV文件**
   ```csv
   主题,发布,提出人,发布内容,格式转换,markdown格标签,图片,渠道&账号,发布完成
   "我的第一篇文章","否","张三","# 我的第一篇文章\n\n内容...","是","test,demo","","devto,hashnode","否"
   ```

### 第2步：上传到GitHub

#### 方法1：通过GitHub网页界面（推荐新手）

1. **打开您的GitHub仓库**
   ```
   https://github.com/您的用户名/您的仓库名
   ```

2. **点击 "Add file" → "Upload files"**
   ![Upload files](https://docs.github.com/assets/cb-106905/images/help/repository/upload-files-button.png)

3. **拖拽或选择您的表格文件**
   - 支持的文件：`.csv`, `.xlsx`, `.xls`
   - 建议文件名：
     - `articles.csv` - 英文表格
     - `chinese-articles.csv` - 中文表格
     - `blog-posts.xlsx` - Excel格式

4. **填写提交信息**
   ```
   提交标题: 📊 添加文章表格 chinese-articles.csv
   
   提交描述（可选）:
   - 添加3篇待发布文章
   - 使用中文列名格式
   ```

5. **点击 "Commit changes"**

#### 方法2：通过Git命令行

```bash
# 1. 将表格文件复制到仓库目录
cp test-chinese-table.csv .

# 2. 添加到Git
git add chinese-articles.csv

# 3. 提交更改
git commit -m "📊 添加文章表格 chinese-articles.csv"

# 4. 推送到GitHub
git push origin main
```

### 第3步：触发GitHub Actions发布

#### 自动触发（定时发布）

GitHub Actions已配置为每天自动运行3次：
- 🕘 北京时间 9:00
- 🕒 北京时间 15:00
- 🕘 北京时间 21:00

系统会自动：
1. 扫描仓库中的所有表格文件
2. 找出未发布的文章
3. 发布到配置的平台
4. 更新表格状态
5. 自动提交更改

#### 手动触发（立即发布）

1. **进入Actions页面**
   - 访问：`https://github.com/您的用户名/您的仓库名/actions`

2. **选择工作流**
   - 点击左侧 "📊 表格批量自动发布"

3. **点击 "Run workflow"**
   ![Run workflow](https://docs.github.com/assets/cb-19779/images/help/actions/actions-tab-run-workflow.png)

4. **配置参数**
   ```yaml
   表格文件路径: chinese-articles.csv
   发布平台: devto,hashnode
   草稿模式: false
   强制发布所有: false
   ```

5. **点击绿色 "Run workflow" 按钮**

### 第4步：查看发布结果

1. **实时查看运行日志**
   - 点击正在运行的工作流
   - 查看各步骤执行情况

2. **查看发布报告**
   ```
   📊 发布统计
   ├─ 总文章数: 3
   ├─ 待发布: 3
   ├─ 成功发布: 2
   └─ 发布失败: 1
   
   ✅ 成功发布:
   - "我的第一篇文章" → DEV.to, Hashnode
   - "技术分享" → DEV.to
   
   ❌ 发布失败:
   - "测试文章" - 错误: 标题重复
   ```

3. **检查更新后的表格**
   - GitHub会自动提交更新后的表格
   - "发布完成"列会更新为"是"
   - 平台URL会记录在后台

## 📁 推荐的文件组织方式

### 基础结构
```
您的仓库/
├── articles.csv              # 主表格文件
├── chinese-articles.csv      # 中文表格
├── drafts/                   # 草稿文件夹
│   └── draft-articles.csv
└── archive/                  # 已发布归档
    └── 2024-published.csv
```

### 多主题管理
```
您的仓库/
├── tech/
│   ├── frontend.csv
│   └── backend.csv
├── life/
│   └── daily-thoughts.csv
└── tutorial/
    └── how-to-guides.csv
```

## 🎯 最佳实践

### 1. 表格文件命名
- ✅ 使用有意义的名称：`tech-articles.csv`, `2024-blogs.xlsx`
- ❌ 避免特殊字符：`my@articles!.csv`
- ✅ 保持一致性：统一使用 `-` 或 `_`

### 2. 批量上传技巧
```bash
# 一次上传多个表格
git add *.csv *.xlsx
git commit -m "📊 批量添加文章表格"
git push
```

### 3. 文章内容管理
- **小文章**（<500字）：直接写在表格的"发布内容"列
- **长文章**（>500字）：使用外部Markdown文件
  ```csv
  主题,发布内容,文件路径
  "长篇教程","","articles/long-tutorial.md"
  ```

### 4. 状态跟踪
表格会自动维护以下状态：
- **发布前**："发布完成"为"否"
- **发布中**：GitHub Actions运行中
- **发布后**："发布完成"自动更新为"是"

## 🔧 高级配置

### 自定义发布时间
编辑 `.github/workflows/table-auto-publish.yml`：
```yaml
on:
  schedule:
    - cron: '0 1 * * *'    # 每天UTC 1:00
    - cron: '0 7 * * 1'   # 每周一UTC 7:00
    - cron: '0 13 * * 5'  # 每周五UTC 13:00
```

### 指定特定表格文件
```yaml
- name: 发布特定表格
  run: |
    node table-publisher.js tech/frontend.csv --draft=false
    node table-publisher.js life/daily.csv --platforms=devto
```

### 条件发布
```yaml
- name: 仅在主分支发布
  if: github.ref == 'refs/heads/main'
  run: npm run table-publish articles.csv
```

## 🚨 常见问题

### Q1: 表格文件没有被识别
**解决方案**：
- 确保文件扩展名正确（`.csv`, `.xlsx`, `.xls`）
- 检查文件编码是否为UTF-8
- 查看Actions日志中的"扫描表格文件"步骤

### Q2: 发布后表格没有更新
**解决方案**：
- 检查仓库设置中的Actions权限
- 确保启用了"Read and write permissions"
- 查看"提交更新"步骤是否成功

### Q3: 中文乱码问题
**解决方案**：
- CSV文件必须使用UTF-8编码保存
- Excel文件自动处理编码，推荐使用
- 使用文本编辑器时选择"UTF-8无BOM"

### Q4: 如何只发布到特定平台
**手动触发时设置**：
```yaml
发布平台: devto          # 仅DEV.to
发布平台: hashnode       # 仅Hashnode
发布平台: devto,hashnode # 两个平台
```

## 📊 完整示例

### 示例1：上传并立即发布
```bash
# 1. 创建表格
echo "主题,发布,提出人,发布内容,格式转换,markdown格标签,图片,渠道&账号,发布完成" > quick-post.csv
echo '"快速发布测试","否","我","# 测试\n\n这是测试内容","是","test","","devto","否"' >> quick-post.csv

# 2. 上传到GitHub
git add quick-post.csv
git commit -m "📊 添加快速发布测试"
git push

# 3. 手动触发Actions（或等待定时任务）
```

### 示例2：批量准备文章
1. 创建多个表格文件
2. 一次性上传
3. Actions会自动处理所有表格

## 🎉 完成！

现在您的表格文件已经上传，GitHub Actions会：
- 🔄 定时检查新文章
- 📤 自动发布到配置的平台
- ✅ 更新发布状态
- 📊 生成详细报告

**下一步**：
1. 查看Actions运行情况
2. 检查平台上的发布结果
3. 继续添加更多文章！ 