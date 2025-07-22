#!/usr/bin/env node

/**
 * Medium发布器测试脚本
 * 
 * 功能：
 * - 测试Medium Cookie配置
 * - 验证用户信息获取
 * - 测试文章发布功能（草稿模式）
 */

require('dotenv').config();
const chalk = require('chalk');
const { MediumPublisher } = require('../src/publishers/medium');

class MediumPublisherTest {
    constructor() {
        this.publisher = new MediumPublisher();
    }

    /**
     * 运行测试
     */
    async runTests() {
        console.log(chalk.cyan('🧪 Medium发布器测试'));
        console.log(chalk.cyan('====================\n'));

        try {
            // 测试1：配置验证
            console.log(chalk.blue('📋 测试1：配置验证'));
            await this.testConfiguration();

            // 测试2：用户信息获取
            console.log(chalk.blue('\n👤 测试2：用户信息获取'));
            await this.testUserInfo();

            // 测试3：发布测试（草稿模式）
            console.log(chalk.blue('\n📝 测试3：草稿发布测试'));
            await this.testDraftPublish();

            console.log(chalk.green('\n✅ 所有测试完成！'));

        } catch (error) {
            console.error(chalk.red('\n❌ 测试失败:'), error.message);
            process.exit(1);
        }
    }

    /**
     * 测试配置验证
     */
    async testConfiguration() {
        const validation = this.publisher.validateConfig();

        if (validation.isValid) {
            console.log(chalk.green('✅ 配置验证通过'));
        } else {
            console.log(chalk.red('❌ 配置验证失败:'));
            validation.errors.forEach(error => {
                console.log(chalk.red(`   - ${error}`));
            });

            console.log(chalk.yellow('\n💡 解决方案：'));
            console.log(chalk.white('1. 确保已登录Medium'));
            console.log(chalk.white('2. 运行：npm run extract-medium-cookies'));
            console.log(chalk.white('3. 按照指导提取Cookie'));
            throw new Error('Medium配置未完成');
        }
    }

    /**
     * 测试用户信息获取
     */
    async testUserInfo() {
        try {
            const userInfo = await this.publisher.getUserInfo();

            if (userInfo && userInfo.username) {
                console.log(chalk.green('✅ 用户信息获取成功'));
                console.log(chalk.gray(`   用户名: ${userInfo.username}`));
                console.log(chalk.gray(`   用户ID: ${userInfo.id}`));
                return userInfo;
            } else {
                throw new Error('无法获取用户信息');
            }
        } catch (error) {
            console.log(chalk.red('❌ 用户信息获取失败'));
            console.log(chalk.yellow('\n💡 可能的原因：'));
            console.log(chalk.white('1. Cookie已过期，需要重新提取'));
            console.log(chalk.white('2. Cookie格式不正确'));
            console.log(chalk.white('3. 网络连接问题'));
            throw error;
        }
    }

    /**
     * 测试草稿发布
     */
    async testDraftPublish() {
        const testArticle = {
            title: '测试文章 - 请勿发布',
            description: '这是一个自动化测试文章，用于验证Medium发布功能',
            tags: ['test', 'automation'],
            content: `# 测试文章

这是一个自动化测试文章，用于验证Medium发布功能。

## 测试内容

- **Markdown支持**: 这是**粗体**文本
- **代码支持**: \`console.log('Hello World')\`
- **列表支持**: 如你所见

## 注意

这是一个测试文章，发布后应该是草稿状态。

---

测试时间: ${new Date().toLocaleString('zh-CN')}`,
            draft: true  // 设置为草稿模式
        };

        try {
            console.log(chalk.blue('🚀 开始发布测试文章（草稿模式）...'));

            const result = await this.publisher.publishArticle(testArticle);

            if (result.success) {
                console.log(chalk.green('✅ 草稿发布测试成功'));
                if (result.url) {
                    console.log(chalk.gray(`   文章链接: ${result.url}`));
                }
                console.log(chalk.gray(`   发布时间: ${result.publishedAt}`));

                console.log(chalk.yellow('\n📝 注意事项：'));
                console.log(chalk.white('- 测试文章已发布为草稿'));
                console.log(chalk.white('- 请登录Medium后台确认'));
                console.log(chalk.white('- 如需要可手动删除测试文章'));
            } else {
                console.log(chalk.red('❌ 草稿发布测试失败'));
                console.log(chalk.red(`   错误: ${result.error}`));
            }

            return result;
        } catch (error) {
            console.log(chalk.red('❌ 草稿发布测试异常'));
            throw error;
        }
    }

    /**
     * 显示帮助信息
     */
    static showHelp() {
        console.log(chalk.cyan('📖 使用说明：'));
        console.log(chalk.white('测试前请确保：'));
        console.log(chalk.white('1. 已运行：npm run extract-medium-cookies'));
        console.log(chalk.white('2. 已在.env文件中配置MEDIUM_COOKIES'));
        console.log(chalk.white('3. Cookie有效且未过期\n'));

        console.log(chalk.cyan('🔧 如果测试失败：'));
        console.log(chalk.white('1. 重新运行Cookie提取工具'));
        console.log(chalk.white('2. 检查Medium登录状态'));
        console.log(chalk.white('3. 确认网络连接正常'));
    }
}

// 主函数
async function main() {
    // 检查参数
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        MediumPublisherTest.showHelp();
        return;
    }

    const tester = new MediumPublisherTest();
    await tester.runTests();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('\n💥 测试过程中发生未预期的错误:'), error.message);
        process.exit(1);
    });
}

module.exports = { MediumPublisherTest }; 