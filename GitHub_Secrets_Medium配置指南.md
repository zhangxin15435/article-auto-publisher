# 🔐 GitHub Secrets中Medium配置指南

## 📋 概述

本指南将帮助你在GitHub Secrets中正确配置Medium Cookie，以实现GitHub Actions自动发布功能。

## 🛠️ 配置步骤

### 步骤1：获取Medium Cookie

如果你还没有Medium Cookie，请先运行：
```bash
npm run extract-medium-cookies
```

或参考 [Cookie提取详细步骤.md](Cookie提取详细步骤.md) 手动提取。

### 步骤2：访问GitHub Secrets配置页面

1. 打开你的GitHub仓库
2. 点击 **Settings（设置）** 标签
3. 在左侧菜单中找到 **Secrets and variables**
4. 点击 **Actions**

### 步骤3：添加MEDIUM_COOKIES Secret

1. 点击 **New repository secret** 按钮
2. 在 **Name** 字段输入：`MEDIUM_COOKIES`
3. 在 **Secret** 字段粘贴你的完整Medium Cookie
4. 点击 **Add secret** 保存

## 🍪 Cookie格式要求

### ✅ 正确的Cookie格式
```
pr=1.5; tz=-480; _ga_L0TFYZVE5F=GS2.2.s1752205284$o1$g0$t1752205284$j60$l0$h0; sz=1692; _gid=GA1.2.1780729326.1753169602; _gcl_au=1.1.1504186025.1752205190.1345983154.1753172447.1753172491; _cfuvid=OK0X.JQl2mO7RZojH8L6BVk.Gzj6QAx1M2Hh_ix4NRY-1753173572545-0.0.1.1-604800000; cf_clearance=n355ckyAe6ujDaFwKBK3SsJP5hYznPFnfAoGC6T.zgY-1753173572-1.2.1.1-JdyDuRuG.kFznLuveU986VJ4_fq13KuBnbNrYOC6uOoJPPnMZn0scvsUCnf6QoUz7MwpQbn47g9i6cOSvRW97UDDYS4E1kSv_NMxXT43FBZpmjGSkb_phGo7uaJevYZsIucRCrv_BMHgcILKaLn9l2ni0l0B5.kD500bCk3D5XIjSYPw.RItIXIl4zMxp1e1xwwGojomoFL.7cpL9cwT.eQpaabQK1lMDrIwimxrAhc; nonce=gIRXjkVY; uid=ff27db888c67; sid=1:hvBEK8b2QRLUdn868fh4dA3KhnkYEfommffuihseEDCUFFWXhQFKTQMj9PbrCSWd; xsrf=YYp2BsJmVPVk5Owf; _ga=GA1.1.2038218990.1752205190; _ga_7JY7T788PK=GS2.1.s1753169598$o24$g1$t1753173695$j24$l0$h0; _dd_s=rum=0&expire=1753174841241
```

### 🔍 必需的Cookie字段
确保你的Cookie包含以下关键字段：
- `uid=` - 用户ID（必需）
- `sid=` - 会话ID（必需）
- `xsrf=` - CSRF令牌（必需）

### ❌ 常见错误格式
- ❌ 只包含部分Cookie
- ❌ 包含换行符或额外空格
- ❌ 缺少关键的认证字段

## ✅ 验证配置

### 方法1：通过GitHub Actions验证
1. 配置完成后，手动触发GitHub Actions工作流
2. 查看"检查平台配置状态"步骤
3. 确认显示：✅ **Medium**: 已配置

### 方法2：本地验证
```bash
# 设置环境变量
export MEDIUM_COOKIES="你的Cookie"

# 运行测试
npm run test-medium
```

### 方法3：查看Actions日志
在GitHub Actions运行后，检查日志中的平台状态：
```
📊 平台配置状态:
   DEV.to: ✅ 已配置
   Hashnode: ❌ 未配置  
   Medium: ✅ 已配置
```

## 🔄 自动发布流程

配置完成后，GitHub Actions将：

1. **每天自动执行**（北京时间6:00, 18:00, 12:00, 24:00）
2. **遍历articles文件夹**中的所有CSV文件
3. **选择未发布内容**进行发布
4. **支持多平台发布**（DEV.to, Hashnode, Medium）
5. **自动删除已发布内容**
6. **提交更新后的CSV文件**

## ⚠️ 安全注意事项

### 🔒 Cookie安全
- ✅ Cookie只在GitHub Secrets中存储，不会在日志中显示
- ✅ 只有仓库管理员可以查看和修改Secrets
- ✅ GitHub Actions运行时会自动掩盖敏感信息

### 🕐 Cookie有效期
- Medium Cookie通常有有效期限制
- 如果发布失败，可能需要重新提取Cookie
- 建议定期更新Cookie以确保稳定性

### 🔄 Cookie刷新
当Cookie过期时：
1. 重新登录Medium
2. 提取新的Cookie
3. 更新GitHub Secrets中的`MEDIUM_COOKIES`

## 🐛 故障排除

### 问题1：显示"❌ Medium: 未配置"
**解决方案**：
- 检查Secret名称是否为 `MEDIUM_COOKIES`（区分大小写）
- 确认Cookie格式正确，没有额外的引号或空格

### 问题2：发布失败
**解决方案**：
- 检查Cookie是否过期
- 验证Medium账号登录状态
- 重新提取并更新Cookie

### 问题3：找不到用户信息
**解决方案**：
- 确认Cookie中包含 `uid=` 字段
- 检查Cookie是否来自正确的Medium账号

## 📞 获取帮助

如果遇到问题：
1. 查看 [Medium使用指南.md](Medium使用指南.md)
2. 运行本地测试：`npm run test-medium`
3. 检查GitHub Actions执行日志
4. 确认Medium账号状态和权限

## 🎯 配置完成清单

- [ ] 已提取Medium Cookie
- [ ] 已在GitHub Secrets中添加 `MEDIUM_COOKIES`
- [ ] 本地测试通过（`npm run test-medium`）
- [ ] GitHub Actions验证通过
- [ ] CSV文件格式正确（包含 `medium_published` 列）
- [ ] 自动发布工作流正常运行

完成以上清单后，你的Medium自动发布功能就配置完成了！🎉 