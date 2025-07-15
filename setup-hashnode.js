#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Hashnode 配置工具
 * 用于获取 Publication ID 和创建环境配置文件
 */
class HashnodeSetup {
    constructor() {
        this.apiKey = '3afaec8b-4377-4aa6-a4e4-45a524ab656d';
        this.envPath = path.join(__dirname, '.env');
    }

    /**
     * 获取用户的 Publication 信息
     */
    async getUserPublications() {
        const query = `
        query Me {
          me {
            id
            username
            name
            publications(first: 10) {
              edges {
                node {
                  id
                  title
                  displayTitle
                  url
                  posts(first: 1) {
                    totalDocuments
                  }
                }
              }
            }
          }
        }
        `;

        try {
            console.log(chalk.blue('正在获取您的 Hashnode Publication 信息...'));

            const response = await axios.post('https://gql.hashnode.com/', {
                query
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey
                }
            });

            if (response.data.errors) {
                throw new Error(`获取 Publication 列表失败: ${JSON.stringify(response.data.errors)}`);
            }

            const userData = response.data.data.me;
            const publications = userData.publications.edges;

            console.log(chalk.green('✅ 成功获取用户信息:'));
            console.log(`用户名: ${chalk.yellow(userData.username)}`);
            console.log(`姓名: ${chalk.yellow(userData.name)}`);
            console.log(`用户ID: ${chalk.yellow(userData.id)}`);

            console.log(chalk.green('\n📚 您的 Publications:'));
            publications.forEach((pub, index) => {
                const publication = pub.node;
                console.log(`${index + 1}. ${chalk.cyan(publication.title)}`);
                console.log(`   ID: ${chalk.yellow(publication.id)}`);
                console.log(`   URL: ${chalk.blue(publication.url)}`);
                console.log(`   文章数量: ${publication.posts.totalDocuments}`);
                console.log('');
            });

            return { userData, publications };
        } catch (error) {
            console.error(chalk.red('❌ 获取 Publication 信息失败:'));
            console.error(chalk.red(error.message));
            throw error;
        }
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
HASHNODE_PUBLICATION_ID=6870b0cb9a73b7cb56af51fe

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
     * 测试发布功能
     */
    async testPublish(publicationId) {
        try {
            console.log(chalk.blue('\n🧪 测试 Hashnode 发布功能...'));

            const { publishToHashnode } = require('./src/publishers/hashnode');

            // 创建测试文章
            const testArticle = {
                title: '测试文章 - ' + new Date().toISOString(),
                content: '# 测试文章\n\n这是一篇测试文章，用于验证 Hashnode 发布功能是否正常工作。\n\n## 测试内容\n\n- 自动发布功能\n- API 连接测试\n- 文章格式化\n\n**注意：这是一篇测试文章，可以安全删除。**',
                description: '这是一篇用于测试 Hashnode 自动发布功能的测试文章',
                tags: ['test', 'automation', 'hashnode']
            };

            const config = {
                apiKey: this.apiKey,
                publicationId: publicationId
            };

            const result = await publishToHashnode(testArticle, config, { draft: true });

            console.log(chalk.green('✅ 测试发布成功!'));
            console.log(`文章ID: ${result.id}`);
            console.log(`状态: ${result.status}`);
            console.log(`平台: ${result.platform}`);

            return result;

        } catch (error) {
            console.error(chalk.red('❌ 测试发布失败:'));
            console.error(chalk.red(error.message));
            throw error;
        }
    }

    /**
     * 主设置流程
     */
    async setup() {
        try {
            console.log(chalk.bold.blue('🚀 Hashnode 自动发布配置工具'));
            console.log('='.repeat(50));

            // 获取 Publication 信息
            const { userData, publications } = await this.getUserPublications();

            if (publications.length === 0) {
                console.log(chalk.red('❌ 没有找到任何 Publications'));
                console.log(chalk.yellow('请先在 Hashnode 上创建一个博客'));
                return false;
            }

            // 如果只有一个 Publication，直接使用
            let selectedPublication;
            if (publications.length === 1) {
                selectedPublication = publications[0].node;
                console.log(chalk.green(`✅ 自动选择唯一的 Publication: ${selectedPublication.title}`));
            } else {
                // 默认选择第一个（在实际应用中可以让用户选择）
                selectedPublication = publications[0].node;
                console.log(chalk.yellow(`⚠️ 检测到多个 Publications，自动选择第一个: ${selectedPublication.title}`));
                console.log(chalk.gray('如需使用其他 Publication，请手动修改 .env 文件中的 HASHNODE_PUBLICATION_ID'));
            }

            // 创建环境配置文件
            if (!this.createEnvFile(selectedPublication.id)) {
                return false;
            }

            // 测试发布功能
            await this.testPublish(selectedPublication.id);

            console.log(chalk.green('\n🎉 Hashnode 自动发布配置完成!'));
            console.log(chalk.blue('\n📝 使用方法:'));
            console.log('1. 将文章放在 articles/ 目录下');
            console.log('2. 运行: npm run publish articles/your-article.md');
            console.log('3. 或者运行: node src/publisher.js articles/your-article.md');

            return true;

        } catch (error) {
            console.error(chalk.red('\n💥 配置失败:'));
            console.error(chalk.red(error.message));
            return false;
        }
    }
}

// 运行配置工具
async function main() {
    const setup = new HashnodeSetup();
    const success = await setup.setup();

    if (!success) {
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { HashnodeSetup }; 