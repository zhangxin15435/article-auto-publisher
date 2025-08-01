#!/usr/bin/env node

/**
 * GitHub Secrets 配置辅助脚本
 * 
 * 这个脚本帮助用户了解如何配置GitHub Secrets用于自动发布
 * 不会实际设置secrets（需要在GitHub网页上手动设置）
 */

const chalk = require('chalk');

console.log(chalk.blue('🔐 GitHub Secrets 配置指南'));
console.log(chalk.blue('═'.repeat(50)));
console.log();

console.log(chalk.yellow('📋 需要配置的Secrets：'));
console.log();

console.log(chalk.cyan('1. DEVTO_API_KEY'));
console.log('   📝 描述: Dev.to平台的API密钥');
console.log('   🔗 获取方式:');
console.log('      1. 登录 https://dev.to');
console.log('      2. 前往 Settings → Account → API Keys');
console.log('      3. 生成新的API Key');
console.log('      4. 复制生成的密钥');
console.log();

console.log(chalk.cyan('2. HASHNODE_API_KEY'));
console.log('   📝 描述: Hashnode平台的API密钥');
console.log('   🔗 获取方式:');
console.log('      1. 登录 https://hashnode.com');
console.log('      2. 前往 Settings → Developer → API Keys');
console.log('      3. 生成Personal Access Token');
console.log('      4. 复制生成的密钥');
console.log();

console.log(chalk.cyan('3. HASHNODE_PUBLICATION_ID'));
console.log('   📝 描述: Hashnode博客的Publication ID');
console.log('   🔗 获取方式:');
console.log('      1. 前往你的Hashnode博客首页');
console.log('      2. 查看URL，格式如: https://yourblog.hashnode.dev');
console.log('      3. 或在设置中查找Publication ID');
console.log();

console.log(chalk.green('🔧 如何在GitHub中配置Secrets：'));
console.log();
console.log('1. 前往你的GitHub仓库页面');
console.log('2. 点击 Settings 选项卡');
console.log('3. 在左侧菜单中选择 Secrets and variables → Actions');
console.log('4. 点击 "New repository secret" 按钮');
console.log('5. 输入Secret名称和值');
console.log('6. 重复步骤4-5，添加所有必需的secrets');
console.log();

console.log(chalk.yellow('⚠️ 安全提醒：'));
console.log('- API密钥是敏感信息，请妥善保管');
console.log('- 不要在代码中硬编码API密钥');
console.log('- 定期检查和更新API密钥');
console.log('- 如果密钥泄露，请立即重新生成');
console.log();

console.log(chalk.blue('🚀 配置完成后：'));
console.log('1. 推送代码到GitHub仓库');
console.log('2. 前往 Actions 选项卡查看工作流');
console.log('3. 可以手动触发工作流进行测试');
console.log('4. 工作流将按计划自动执行（每天6点、12点、18点、24点）');
console.log();

console.log(chalk.green('✅ 配置检查清单：'));
console.log('□ 已创建DEVTO_API_KEY secret');
console.log('□ 已创建HASHNODE_API_KEY secret');
console.log('□ 已创建HASHNODE_PUBLICATION_ID secret');
console.log('□ 已将代码推送到GitHub');
console.log('□ 已测试工作流运行');
console.log();

console.log(chalk.magenta('💡 提示：'));
console.log('- 首次运行建议使用草稿模式测试');
console.log('- 可以在Actions页面手动触发工作流');
console.log('- 查看执行日志来调试问题');
console.log('- 确保articles目录中有待发布的文章');

module.exports = {}; 