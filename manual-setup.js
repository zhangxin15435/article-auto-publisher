#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * 手动配置 Hashnode 发布工具
 */
class ManualHashnodeSetup {
    constructor() {
        this.apiKey = '3afaec8b-4377-4aa6-a4e4-45a524ab656d';
        this.envPath = path.join(__dirname, '.env');
    }

    /**
     * 创建环境配置文件
     */
    createEnvFile(publicationId) {
        const envContent = `# 多平台文章发布工具 - 环境变量配置

# =============================================================================
# Hashnode 配置
# =============================================================================
# Hashnode API Token
HASHNODE_API_KEY=${this.apiKey}

# Publication ID
HASHNODE_PUBLICATION_ID=${publicationId}

# =============================================================================
# 其他平台配置（可选）
# =============================================================================
# DEV.to API Key (可选)
# DEVTO_API_KEY=your_devto_api_key_here

# Hacker News 配置（可选）
# HN_USERNAME=your_hackernews_username
# HN_PASSWORD=your_hackernews_password

# =============================================================================
# 其他配置
# =============================================================================
# 默认发布延迟（毫秒）
DEFAULT_PUBLISH_DELAY=2000

# 是否启用调试模式
DEBUG=true

# 默认时区
TIMEZONE=Asia/Shanghai

# 默认文章目录
ARTICLES_DIR=./articles

# 日志级别
LOG_LEVEL=info
`;

        try {
            fs.writeFileSync(this.envPath, envContent, 'utf8');
            console.log(chalk.green('✅ 环境配置文件创建成功: .env'));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ 创建环境配置文件失败:'));
            console.error(chalk.red(error.message));
            return false;
        }
    }

    /**
     * 显示创建博客的指导
     */
    showCreateBlogInstructions() {
        console.log(chalk.bold.blue('📝 如何在 Hashnode 上创建博客:'));
        console.log('='.repeat(50));
        console.log('1. 访问 https://hashnode.com');
        console.log('2. 登录您的账户');
        console.log('3. 点击右上角的 "Create Blog" 或 "创建博客"');
        console.log('4. 填写博客信息：');
        console.log('   - 博客名称（例如：My Tech Blog）');
        console.log('   - 博客域名（例如：mytechblog.hashnode.dev）');
        console.log('   - 博客描述');
        console.log('5. 创建完成后，您的博客 URL 将类似：');
        console.log('   https://mytechblog.hashnode.dev');
        console.log('');
        console.log(chalk.yellow('📋 获取 Publication ID:'));
        console.log('1. 创建博客后，进入博客的仪表板');
        console.log('2. 在浏览器地址栏中查看 URL，类似：');
        console.log('   https://hashnode.com/[PUBLICATION_ID]/dashboard');
        console.log('3. 复制方括号中的 Publication ID');
        console.log('');
    }

    /**
     * 使用临时的通用 Publication ID 进行配置
     */
    setupWithTemporaryId() {
        console.log(chalk.yellow('⚠️ 使用临时配置创建环境文件...'));
        console.log(chalk.gray('您需要稍后手动修改 .env 文件中的 HASHNODE_PUBLICATION_ID'));

        // 使用占位符
        const tempPublicationId = 'YOUR_PUBLICATION_ID_HERE';

        if (this.createEnvFile(tempPublicationId)) {
            console.log(chalk.green('✅ 临时配置文件已创建'));
            console.log(chalk.blue('\n📝 下一步操作:'));
            console.log('1. 按照上面的指导创建 Hashnode 博客');
            console.log('2. 获取您的 Publication ID');
            console.log('3. 编辑 .env 文件，将 YOUR_PUBLICATION_ID_HERE 替换为实际的 Publication ID');
            console.log('4. 运行测试: node test-publish.js');

            return true;
        }

        return false;
    }

    /**
     * 主配置流程
     */
    setup() {
        console.log(chalk.bold.blue('🚀 Hashnode 手动配置工具'));
        console.log('='.repeat(50));

        this.showCreateBlogInstructions();
        this.setupWithTemporaryId();

        console.log(chalk.green('\n🎉 配置完成!'));
        console.log(chalk.blue('\n📝 使用方法:'));
        console.log('1. 完成上述博客创建步骤');
        console.log('2. 更新 .env 文件中的 Publication ID');
        console.log('3. 测试发布: node test-publish.js');
        console.log('4. 正式发布: npm run publish articles/your-article.md');
    }
}

// 运行配置工具
function main() {
    const setup = new ManualHashnodeSetup();
    setup.setup();
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { ManualHashnodeSetup }; 