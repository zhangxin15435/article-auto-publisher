# 📊 内容库CSV自动提取功能

## 🎯 功能概述

这个功能允许您上传包含文章元数据的内容库CSV文件，系统会自动：
1. 📝 提取文章数据
2. 📄 转换为ready-to-publish.csv格式
3. 🗑️ 删除原始内容库文件
4. 💾 创建备份文件

## 📁 文件命名规则

支持的内容库CSV文件命名模式：
- `内容库*.csv`
- `*内容库*.csv`
- 示例：`内容库_发布数据@zc_发布情况 (2).csv`

## 🔄 工作流程

### 自动触发
当您上传符合命名规则的CSV文件到`articles/`目录时，GitHub Actions会自动：

1. **检测文件** - 识别新上传的内容库CSV文件
2. **提取数据** - 运行`scripts/extract-content-db.js`脚本
3. **编码处理** - 自动检测并处理中文编码（支持UTF-8, GBK, GB2312, Big5, UTF-16LE）
4. **数据验证** - 验证文章标题和内容路径
5. **格式转换** - 转换为发布队列格式
6. **追加数据** - 添加到`ready-to-publish.csv`
7. **清理文件** - 删除原始内容库文件
8. **创建备份** - 保存备份到`processed-backups/`目录
9. **提交更改** - 自动提交和推送更改

### 手动触发
您也可以在GitHub Actions页面手动触发工作流：
- 前往仓库的Actions页面
- 选择"🔄 内容库CSV文件自动提取"
- 点击"Run workflow"
- 选择是否强制处理所有内容库文件

## 📋 CSV格式要求

### 输入格式（内容库CSV）
```csv
title,content,tags,author,...
文章标题1,article1.md,"tag1,tag2",作者名称,...
文章标题2,article2.md,"tag3,tag4",作者名称,...
```

### 输出格式（ready-to-publish.csv）
```csv
title,description,tags,file_path,devto_published,hashnode_published,author
文章标题1,文章描述,tag1;tag2,article1.md,FALSE,FALSE,作者名称
```

## 🛠️ 技术特性

### 编码支持
- ✅ UTF-8
- ✅ GBK / GB2312
- ✅ Big5
- ✅ UTF-16LE
- 🔄 自动检测和转换

### 数据处理
- 📝 标题验证和清理
- 🏷️ 标签格式转换（逗号分隔 → 分号分隔）
- 📄 文件路径验证
- 🚫 重复数据过滤

### 错误处理
- ❌ 无效文件跳过
- 📝 详细错误日志
- 🔄 容错继续处理
- 💾 失败时保留原文件

## 📊 处理报告

每次处理完成后，系统会生成详细报告：
- ✅ 处理状态
- 📝 文章数量统计
- 💾 备份文件信息
- 🎯 下一步操作指南

## 🔧 配置说明

### 环境变量
无需额外配置，使用默认设置即可。

### 文件结构
```
articles/
├── ready-to-publish.csv          # 发布队列
├── processed-backups/            # 备份目录
│   ├── .gitkeep                 # Git跟踪文件
│   └── *.csv                    # 处理完成的备份
└── 内容库*.csv                   # 待处理文件
```

## 🚀 使用步骤

1. **准备内容库CSV文件**
   - 确保包含必要的列：title, content, tags, author
   - 内容列应包含Markdown文件名
   - 确保对应的Markdown文件存在于articles/目录

2. **上传文件**
   - 将内容库CSV文件上传到`articles/`目录
   - 文件名包含"内容库"字样

3. **自动处理**
   - GitHub Actions自动检测并处理
   - 查看Actions页面了解处理状态

4. **验证结果**
   - 检查`ready-to-publish.csv`是否更新
   - 确认原文件已删除
   - 验证备份文件已创建

## 📝 注意事项

- ⚠️ 确保Markdown文件路径正确
- ⚠️ 标题不能为空
- ⚠️ 处理完成的文件会被删除（备份保留）
- ⚠️ 重复数据会被自动过滤
- ⚠️ 文件编码问题会自动处理

## 🔗 相关文件

- `scripts/extract-content-db.js` - 提取脚本
- `.github/workflows/extract-content-db.yml` - GitHub Actions工作流
- `articles/processed-backups/` - 备份目录
- `articles/ready-to-publish.csv` - 发布队列 