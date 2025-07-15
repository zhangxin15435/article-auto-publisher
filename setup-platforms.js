#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class PlatformSetup {
    constructor() {
        this.envPath = './.env';
        this.currentConfig = {};
        this.loadCurrentConfig();
    }

    // 加载当前配置
    loadCurrentConfig() {
        if (fs.existsSync(this.envPath)) {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\n');

            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    this.currentConfig[key.trim()] = value.trim();
                }
            });
        }
    }

    // 显示当前配置状态
    showCurrentStatus() {
        console.log(chalk.blue('📡 多平台发布工具 - 配置助手'));
        console.log(chalk.blue('====================================='));
        console.log();

        const platforms = [
            {
                name: 'Dev.to',
                key: 'DEVTO_API_KEY',
                configured: !!this.currentConfig.DEVTO_API_KEY
            },
            {
                name: 'Hashnode',
                keys: ['HASHNODE_API_KEY', 'HASHNODE_PUBLICATION_ID'],
                configured: !!(this.currentConfig.HASHNODE_API_KEY && this.currentConfig.HASHNODE_PUBLICATION_ID)
            },
            {
                name: 'Medium',
                keys: ['MEDIUM_TOKEN', 'MEDIUM_USER_ID'],
                configured: !!(this.currentConfig.MEDIUM_TOKEN && this.currentConfig.MEDIUM_USER_ID),
                note: '注意：Medium 已停止新用户 API 申请'
            },
            {
                name: 'Hacker News',
                keys: ['HN_USERNAME', 'HN_PASSWORD'],
                configured: !!(this.currentConfig.HN_USERNAME && this.currentConfig.HN_PASSWORD),
                note: '用于生成自动提交链接'
            }
        ];

        console.log(chalk.yellow('🔧 当前配置状态:'));
        platforms.forEach(platform => {
            const status = platform.configured ?
                chalk.green('✅ 已配置') : chalk.red('❌ 未配置');
            console.log(`   ${platform.name}: ${status}`);
            if (platform.note) {
                console.log(chalk.gray(`      ${platform.note}`));
            }
        });

        console.log();
    }

    // 显示配置指南
    showConfigurationGuide() {
        console.log(chalk.yellow('📋 配置指南:'));
        console.log();

        // Dev.to 配置
        console.log(chalk.cyan('🟦 Dev.to 配置:'));
        console.log('1. 访问 https://dev.to/settings/account');
        console.log('2. 滚动到 "API Keys" 部分');
        console.log('3. 点击 "Generate API Key"');
        console.log('4. 复制生成的 API Key');
        console.log(`5. 运行: ${chalk.green('node setup-platforms.js --set-devto=YOUR_API_KEY')}`);
        console.log();

        // Hashnode 配置
        console.log(chalk.cyan('🟦 Hashnode 配置:'));
        console.log('1. 访问 https://hashnode.com/settings/developer');
        console.log('2. 生成 Personal Access Token');
        console.log('3. 获取 Publication ID:');
        console.log('   - 访问你的博客仪表板');
        console.log('   - 从 URL 中提取 ID (例如: hashnode.com/YOUR_ID/dashboard)');
        console.log(`4. 运行: ${chalk.green('node setup-platforms.js --set-hashnode=API_KEY,PUBLICATION_ID')}`);
        console.log();

        // Medium 配置
        console.log(chalk.cyan('🟦 Medium 配置 (已停止新用户):'));
        console.log('1. Medium 已不再支持新的 Integration Token 申请');
        console.log('2. 如果你已有 token，可以配置:');
        console.log(`   ${chalk.green('node setup-platforms.js --set-medium=TOKEN,USER_ID')}`);
        console.log('3. 建议使用 Medium 浏览器自动化版本');
        console.log();

        // Hacker News 配置
        console.log(chalk.cyan('🟦 Hacker News 配置:'));
        console.log('1. Hacker News 没有官方 API');
        console.log('2. 配置账号信息用于生成自动提交链接');
        console.log(`3. 运行: ${chalk.green('node setup-platforms.js --set-hn=USERNAME,PASSWORD')}`);
        console.log();
    }

    // 更新环境变量文件
    updateEnvFile(updates) {
        let envContent = '';

        if (fs.existsSync(this.envPath)) {
            envContent = fs.readFileSync(this.envPath, 'utf8');
        }

        // 更新或添加配置
        Object.keys(updates).forEach(key => {
            const value = updates[key];
            const regex = new RegExp(`^${key}=.*$`, 'm');

            if (regex.test(envContent)) {
                // 更新现有配置
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                // 添加新配置
                envContent += `\n${key}=${value}`;
            }
        });

        // 清理多余的空行
        envContent = envContent.replace(/\n\n+/g, '\n\n').trim() + '\n';

        fs.writeFileSync(this.envPath, envContent, 'utf8');
        console.log(chalk.green(`✅ 配置已保存到 ${this.envPath}`));
    }

    // 设置 Dev.to 配置
    setDevToConfig(apiKey) {
        console.log(chalk.cyan('🔧 配置 Dev.to...'));

        this.updateEnvFile({
            'DEVTO_API_KEY': apiKey
        });

        console.log(chalk.green('✅ Dev.to 配置完成'));
        console.log(`测试发布: ${chalk.blue('node multi-platform-publisher.js --platforms=devto --draft --yes')}`);
    }

    // 设置 Hashnode 配置
    setHashnodeConfig(apiKey, publicationId) {
        console.log(chalk.cyan('🔧 配置 Hashnode...'));

        this.updateEnvFile({
            'HASHNODE_API_KEY': apiKey,
            'HASHNODE_PUBLICATION_ID': publicationId
        });

        console.log(chalk.green('✅ Hashnode 配置完成'));
        console.log(`测试发布: ${chalk.blue('node multi-platform-publisher.js --platforms=hashnode --draft --yes')}`);
    }

    // 设置 Medium 配置
    setMediumConfig(token, userId) {
        console.log(chalk.cyan('🔧 配置 Medium...'));

        this.updateEnvFile({
            'MEDIUM_TOKEN': token,
            'MEDIUM_USER_ID': userId
        });

        console.log(chalk.green('✅ Medium 配置完成'));
        console.log(chalk.yellow('⚠️ 注意：Medium 已停止新用户 API 申请'));
        console.log(`测试发布: ${chalk.blue('node multi-platform-publisher.js --platforms=medium --draft --yes')}`);
    }

    // 设置 Hacker News 配置
    setHackerNewsConfig(username, password) {
        console.log(chalk.cyan('🔧 配置 Hacker News...'));

        this.updateEnvFile({
            'HN_USERNAME': username,
            'HN_PASSWORD': password
        });

        console.log(chalk.green('✅ Hacker News 配置完成'));
        console.log(chalk.yellow('📋 说明：将生成自动提交链接，需要手动登录提交'));
        console.log(`测试: ${chalk.blue('node multi-platform-publisher.js --platforms=hackernews --yes')}`);
    }

    // 显示测试命令
    showTestCommands() {
        console.log(chalk.yellow('🧪 测试命令:'));
        console.log();

        console.log('单平台测试:');
        console.log(`  ${chalk.blue('node multi-platform-publisher.js --platforms=devto --draft --yes')}`);
        console.log(`  ${chalk.blue('node multi-platform-publisher.js --platforms=hashnode --draft --yes')}`);
        console.log();

        console.log('多平台测试:');
        console.log(`  ${chalk.blue('node multi-platform-publisher.js --platforms=devto,hashnode --draft --yes')}`);
        console.log();

        console.log('指定文章:');
        console.log(`  ${chalk.blue('node multi-platform-publisher.js --file=test.md --platforms=devto --draft --yes')}`);
        console.log();

        console.log('查看配置状态:');
        console.log(`  ${chalk.blue('node multi-platform-publisher.js')}`);
        console.log();
    }

    // 主运行方法
    run() {
        const args = process.argv.slice(2);

        // 处理命令行参数
        if (args.length === 0) {
            this.showCurrentStatus();
            this.showConfigurationGuide();
            this.showTestCommands();
            return;
        }

        // 设置 Dev.to
        const devtoArg = args.find(arg => arg.startsWith('--set-devto='));
        if (devtoArg) {
            const apiKey = devtoArg.split('=')[1];
            this.setDevToConfig(apiKey);
            return;
        }

        // 设置 Hashnode
        const hashnodeArg = args.find(arg => arg.startsWith('--set-hashnode='));
        if (hashnodeArg) {
            const [apiKey, publicationId] = hashnodeArg.split('=')[1].split(',');
            if (!apiKey || !publicationId) {
                console.error(chalk.red('❌ 错误：需要提供 API_KEY,PUBLICATION_ID'));
                return;
            }
            this.setHashnodeConfig(apiKey, publicationId);
            return;
        }

        // 设置 Medium
        const mediumArg = args.find(arg => arg.startsWith('--set-medium='));
        if (mediumArg) {
            const [token, userId] = mediumArg.split('=')[1].split(',');
            if (!token || !userId) {
                console.error(chalk.red('❌ 错误：需要提供 TOKEN,USER_ID'));
                return;
            }
            this.setMediumConfig(token, userId);
            return;
        }

        // 设置 Hacker News
        const hnArg = args.find(arg => arg.startsWith('--set-hn='));
        if (hnArg) {
            const [username, password] = hnArg.split('=')[1].split(',');
            if (!username || !password) {
                console.error(chalk.red('❌ 错误：需要提供 USERNAME,PASSWORD'));
                return;
            }
            this.setHackerNewsConfig(username, password);
            return;
        }

        // 显示帮助
        if (args.includes('--help') || args.includes('-h')) {
            this.showCurrentStatus();
            this.showConfigurationGuide();
            this.showTestCommands();
            return;
        }

        console.error(chalk.red('❌ 未知参数'));
        console.log(`运行 ${chalk.blue('node setup-platforms.js --help')} 查看帮助`);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const setup = new PlatformSetup();
    setup.run();
}

module.exports = PlatformSetup; 