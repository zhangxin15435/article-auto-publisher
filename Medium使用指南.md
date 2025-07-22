# 🍪 Medium Cookie配置和使用指南

## 📋 快速开始

### 1. 提取Medium登录Cookie

```bash
# 运行Cookie提取工具
npm run extract-medium-cookies
```

### 2. 按照工具指导操作

1. **登录Medium**：在浏览器中打开 https://medium.com 并登录
2. **打开开发者工具**：按F12
3. **查看网络请求**：
   - 点击"Network"标签
   - 刷新页面
   - 找到任意请求
   - 复制完整的Cookie值

### 3. 验证配置

```bash
# 测试Medium功能
npm run test-medium
```

## 🔧 GitHub Actions配置

### 添加Secrets

在GitHub仓库中：
1. 前往 `Settings → Secrets and variables → Actions`
2. 添加Secret：`MEDIUM_COOKIES`
3. 粘贴你提取的Cookie值

### 验证配置

GitHub Actions会自动验证所有平台配置：
- ✅ DEV.to: API密钥配置
- ✅ Hashnode: API密钥+Publication ID配置  
- ✅ Medium: Cookie配置

## 📝 CSV文件格式

确保你的CSV文件包含 `medium_published` 列：

```csv
title,description,tags,content,devto_published,hashnode_published,medium_published
"文章标题","描述","tag1,tag2","# 内容",false,false,false
```

## ⏰ 自动发布时间

系统将在以下时间自动执行发布（北京时间）：
- 🕕 **6:00**
- 🕕 **18:00** 
- 🕛 **12:00**
- 🕛 **24:00**

## 🔍 功能特点

### Medium发布器特点
- **Cookie认证**：使用浏览器登录状态
- **Markdown支持**：自动转换为Medium格式
- **标签支持**：最多5个标签
- **草稿模式**：测试时自动使用草稿
- **错误处理**：完善的错误提示和日志

### 安全性
- Cookie仅用于API请求
- 支持过期检测和重新配置
- 不会泄露敏感信息

## 🛠️ 故障排除

### Cookie失效
```bash
# 重新提取Cookie
npm run extract-medium-cookies
```

### 测试失败
```bash
# 运行详细测试
npm run test-medium
```

### 发布失败
1. 检查Cookie是否过期
2. 确认Medium登录状态
3. 验证网络连接
4. 查看GitHub Actions日志

## 📊 监控和日志

### 查看发布状态
- GitHub Actions页面查看执行日志
- 检查CSV文件中的 `medium_published` 字段更新

### 验证发布结果
- 登录Medium后台查看草稿/已发布文章
- 确认文章格式和标签正确

## 💡 最佳实践

1. **定期更新Cookie**：建议每月重新提取一次
2. **测试先行**：使用草稿模式测试新配置
3. **备份内容**：发布前备份CSV文件
4. **监控日志**：定期检查GitHub Actions执行情况

## ❓ 常见问题

**Q: Cookie多久过期？**
A: 通常几周到几个月，建议定期更新

**Q: 是否支持草稿发布？**
A: 是的，测试时自动使用草稿模式

**Q: 能否手动触发发布？**
A: 可以在GitHub Actions页面手动触发

**Q: 如何删除测试文章？**
A: 登录Medium后台手动删除草稿文章

---

## 🎉 完成！

现在你已经成功配置了三平台自动发布系统：
- **DEV.to** ✅
- **Hashnode** ✅  
- **Medium** ✅

享受自动化内容发布的便利吧！ 🚀 