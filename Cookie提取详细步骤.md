# 🍪 Medium Cookie提取详细步骤

## 📋 准备工作

1. **确保已登录Medium**
   - 打开 https://medium.com
   - 确认右上角显示你的头像（已登录状态）

2. **打开开发者工具**
   - 按 `F12` 键
   - 或右键点击页面 → "检查元素"

## 🔍 方法一：从网络请求提取Cookie（推荐）

### 步骤1：准备网络监控
1. 点击 **Network（网络）** 标签
2. 如果有历史请求，点击 🚫 **清除** 按钮
3. 确保 **Preserve log（保留日志）** 已勾选

### 步骤2：触发网络请求
1. 在Medium页面上刷新页面（Ctrl+F5）
2. 或者点击任意链接（如你的个人资料）

### 步骤3：查找Cookie
1. 在请求列表中找到 **medium.com** 的请求
2. **点击该请求行**（不是复选框）
3. 右侧会显示请求详情

### 步骤4：复制Cookie
1. 在右侧面板找到 **Headers（标头）** 标签
2. 向下滚动找到 **Request Headers（请求标头）**
3. 找到 **Cookie:** 字段
4. **复制整个Cookie值**（可能很长）

## 🔍 方法二：从Application面板提取

### 步骤1：打开Application面板
1. 在开发者工具中点击 **Application（应用）** 标签
2. 如果没有看到，点击 **>>** 查找更多标签

### 步骤2：查看Cookies
1. 在左侧面板展开 **Cookies** 
2. 点击 **https://medium.com**

### 步骤3：复制所有Cookie
1. 选择所有Cookie行
2. 按Ctrl+A全选，Ctrl+C复制
3. 或者手动拼接格式：`name1=value1; name2=value2; ...`

## 🔍 方法三：使用Console命令

### 在Console面板运行
```javascript
console.log(document.cookie);
```
复制输出的完整字符串。

## ⚠️ 常见问题排查

### 问题1：没有看到Cookie字段
**原因**：可能没有登录或Cookie已过期
**解决**：
1. 确认已登录Medium
2. 尝试访问你的个人资料页面
3. 重新刷新页面查看请求

### 问题2：Cookie值为空
**原因**：浏览器隐私设置或无痕模式
**解决**：
1. 退出无痕模式
2. 检查浏览器Cookie设置
3. 重新登录Medium

### 问题3：找不到medium.com请求
**原因**：页面已完全加载
**解决**：
1. 清除网络日志
2. 强制刷新页面（Ctrl+Shift+R）
3. 或者访问其他Medium页面

## ✅ 验证Cookie格式

正确的Medium Cookie应该包含类似这些字段：
```
uid=...; sid=...; __cfruid=...; lightstep_guid/medium-web=...; _ga=...; _gid=...
```

## 🛠️ 使用提取工具

提取到Cookie后，运行我们的工具：
```bash
npm run extract-medium-cookies
```

按提示粘贴Cookie值即可！

## 📞 需要帮助？

如果仍然无法提取Cookie，请：
1. 确认浏览器类型和版本
2. 检查是否在无痕模式
3. 尝试不同的方法
4. 重新登录Medium账号 