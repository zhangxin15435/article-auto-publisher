#!/usr/bin/env node

/**
 * Medium Cookie提取脚本
 * 
 * 功能：
 * - 指导用户如何从浏览器提取Medium的登录Cookie
 * - 验证Cookie的有效性
 * - 提供自动化的Cookie管理功能
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const { MediumPublisher } = require('../src/publishers/medium');

class MediumCookieExtractor {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.envPath = path.join(__dirname, '..', '.env');
    }

    /**
     * 启动Cookie提取流程
     */
    async start() {
        try {
            console.log(chalk.cyan('🍪 Medium Cookie提取工具'));
            console.log(chalk.cyan('==========================\n'));

            console.log(chalk.blue('这个工具将帮助你提取Medium的登录Cookie用于自动发布文章。\n'));

            await this.showInstructions();
            await this.extractCookie();

        } catch (error) {
            console.error(chalk.red('❌ 提取过程中出现错误:'), error.message);
        } finally {
            this.rl.close();
        }
    }

    /**
     * 显示提取说明
     */
    async showInstructions() {
        console.log(chalk.yellow('📋 Cookie提取步骤：'));
        console.log(chalk.white('1. 在浏览器中打开 https://medium.com'));
        console.log(chalk.white('2. 登录你的Medium账号'));
        console.log(chalk.white('3. 按F12打开开发者工具'));
        console.log(chalk.white('4. 点击"Network"(网络)标签'));
        console.log(chalk.white('5. 刷新页面或访问任意Medium页面'));
        console.log(chalk.white('6. 找到任意请求，点击查看请求头'));
        console.log(chalk.white('7. 复制"Cookie"字段的完整值\n'));

        console.log(chalk.yellow('💡 提示：'));
        console.log(chalk.white('- Cookie包含你的登录信息，请妥善保管'));
        console.log(chalk.white('- Cookie有有效期，过期后需要重新提取'));
        console.log(chalk.white('- 不要在公共场合分享你的Cookie\n'));

        await this.question(chalk.green('按回车键继续...'));
    }

    /**
     * 提取Cookie
     */
    async extractCookie() {
        const cookie = await this.question(chalk.blue('请粘贴你的Medium Cookie: '));

        if (!cookie || cookie.trim().length === 0) {
            console.log(chalk.red('❌ Cookie不能为空！'));
            return await this.extractCookie();
        }

        console.log(chalk.blue('\n🔍 验证Cookie有效性...'));

        const isValid = await this.validateCookie(cookie.trim());

        if (isValid) {
            console.log(chalk.green('✅ Cookie验证成功！'));
            await this.saveCookie(cookie.trim());
        } else {
            console.log(chalk.red('❌ Cookie验证失败！'));
            const retry = await this.question(chalk.yellow('是否重新输入？(y/n): '));

            if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
                return await this.extractCookie();
            }
        }
    }

    /**
     * 验证Cookie有效性
     */
    async validateCookie(cookie) {
        try {
            const publisher = new MediumPublisher({ cookies: cookie });
            const userInfo = await publisher.getUserInfo();

            if (userInfo && userInfo.username) {
                console.log(chalk.green(`✅ 检测到用户: ${userInfo.username}`));
                return true;
            }

            return false;
        } catch (error) {
            console.error(chalk.red('验证失败:'), error.message);
            return false;
        }
    }

    /**
     * 保存Cookie到环境变量文件
     */
    async saveCookie(cookie) {
        try {
            let envContent = '';

            // 读取现有的.env文件
            if (fs.existsSync(this.envPath)) {
                envContent = fs.readFileSync(this.envPath, 'utf8');
            }

            // 更新或添加MEDIUM_COOKIES
            const cookieVar = 'MEDIUM_COOKIES';
            const cookieLine = `${cookieVar}="${cookie}"`;

            if (envContent.includes(cookieVar)) {
                // 更新现有的MEDIUM_COOKIES
                envContent = envContent.replace(
                    new RegExp(`^${cookieVar}=.*$`, 'm'),
                    cookieLine
                );
            } else {
                // 添加新的MEDIUM_COOKIES
                if (envContent && !envContent.endsWith('\n')) {
                    envContent += '\n';
                }
                envContent += `\n# Medium配置\n${cookieLine}\n`;
            }

            // 写入文件
            fs.writeFileSync(this.envPath, envContent);

            console.log(chalk.green('✅ Cookie已保存到.env文件'));
            console.log(chalk.blue('💡 现在你可以使用Medium自动发布功能了！'));

            // 显示使用说明
            this.showUsageInstructions();

        } catch (error) {
            console.error(chalk.red('❌ 保存Cookie失败:'), error.message);
        }
    }

    /**
     * 显示使用说明
     */
    showUsageInstructions() {
        console.log(chalk.cyan('\n📖 使用说明：'));
        console.log(chalk.white('1. 确保你的CSV文件包含medium_published列'));
        console.log(chalk.white('2. 运行自动发布脚本: npm run auto-csv-publish'));
        console.log(chalk.white('3. 或手动发布: node scripts/auto-csv-publisher.js'));
        console.log(chalk.white('4. 查看GitHub Actions自动发布结果\n'));

        console.log(chalk.yellow('📁 CSV文件格式示例：'));
        console.log(chalk.gray('title,description,tags,content,devto_published,hashnode_published,medium_published'));
        console.log(chalk.gray('"文章标题","文章描述","tag1,tag2","文章内容",false,false,false\n'));
    }

    /**
     * 询问问题
     */
    question(query) {
        return new Promise((resolve) => {
            this.rl.question(query, resolve);
        });
    }
}

// 主函数
async function main() {
    const extractor = new MediumCookieExtractor();
    await extractor.start();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MediumCookieExtractor }; 