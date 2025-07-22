// 加载环境变量
require('dotenv').config();

console.log('\n🔍 环境变量调试信息');
console.log('══════════════════════════════════════════════════');

// 检查DEV.to配置
const devtoApiKey = process.env.DEVTO_API_KEY;
console.log('DEV.to API Key:', devtoApiKey ? `已配置 (${devtoApiKey.substring(0, 3)}...)` : '未配置');

// 检查Hashnode配置
const hashnodeApiKey = process.env.HASHNODE_API_KEY;
const hashnodePublicationId = process.env.HASHNODE_PUBLICATION_ID;
console.log('Hashnode API Key:', hashnodeApiKey ? `已配置 (${hashnodeApiKey.substring(0, 3)}...)` : '未配置');
console.log('Hashnode Publication ID:', hashnodePublicationId ? `已配置 (${hashnodePublicationId.substring(0, 3)}...)` : '未配置');

// 检查Node.js环境
console.log('\n📊 Node.js环境:');
console.log('Node.js版本:', process.version);
console.log('操作系统:', process.platform);
console.log('当前工作目录:', process.cwd());

// 检查dotenv
try {
    const dotenvPath = require.resolve('dotenv');
    console.log('\n📦 dotenv模块:', dotenvPath);
} catch (error) {
    console.log('\n❌ dotenv模块未安装');
}

// 输出环境变量总数
const envVarCount = Object.keys(process.env).length;
console.log(`\n🔢 环境变量总数: ${envVarCount}`);

// 检查是否在GitHub Actions环境中运行
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
console.log(`\n🤖 GitHub Actions环境: ${isGitHubActions ? '是' : '否'}`);
if (isGitHubActions) {
    console.log('GitHub仓库:', process.env.GITHUB_REPOSITORY);
    console.log('GitHub工作流:', process.env.GITHUB_WORKFLOW);
    console.log('GitHub事件:', process.env.GITHUB_EVENT_NAME);
}

console.log('\n✅ 调试信息输出完成'); 