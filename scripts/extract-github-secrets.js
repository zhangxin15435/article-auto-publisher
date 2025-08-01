#!/usr/bin/env node

/**
 * GitHub Secrets 提取工具
 * 
 * 从当前项目配置中提取API密钥信息，用于配置GitHub Secrets
 */

require('dotenv').config();
const fs = require('fs');
const chalk = require('chalk');

console.log(chalk.blue('🔐 GitHub Secrets 提取工具'));
console.log(chalk.blue('═'.repeat(50)));
console.log();

/**
 * 需要提取的GitHub Secrets
 */
const requiredSecrets = [
    {
        name: 'DEVTO_API_KEY',
        description: 'Dev.to API密钥',
        envVar: 'DEVTO_API_KEY',
        required: true
    },
    {
        name: 'HASHNODE_API_KEY', 
        description: 'Hashnode API密钥',
        envVar: 'HASHNODE_API_KEY',
        required: true
    },
    {
        name: 'HASHNODE_PUBLICATION_ID',
        description: 'Hashnode Publication ID',
        envVar: 'HASHNODE_PUBLICATION_ID',
        required: true
    }
];

/**
 * 检查环境变量配置
 */
function checkEnvironmentVariables() {
    console.log(chalk.yellow('🔍 检查当前环境变量配置...'));
    console.log();

    const extractedSecrets = [];
    let hasErrors = false;

    requiredSecrets.forEach(secret => {
        const value = process.env[secret.envVar];
        
        if (value) {
            // 隐藏部分密钥内容用于显示
            const maskedValue = value.length > 10 ? 
                value.substring(0, 6) + '***' + value.substring(value.length - 4) :
                '***' + value.substring(value.length - 2);
                
            console.log(chalk.green(`✅ ${secret.name}`));
            console.log(chalk.gray(`   描述: ${secret.description}`));
            console.log(chalk.gray(`   当前值: ${maskedValue}`));
            console.log(chalk.gray(`   完整长度: ${value.length} 字符`));
            
            extractedSecrets.push({
                name: secret.name,
                value: value,
                description: secret.description
            });
        } else {
            console.log(chalk.red(`❌ ${secret.name}`));
            console.log(chalk.gray(`   描述: ${secret.description}`));
            console.log(chalk.gray(`   状态: 未配置`));
            
            if (secret.required) {
                hasErrors = true;
            }
        }
        console.log();
    });

    return { extractedSecrets, hasErrors };
}

/**
 * 生成GitHub Secrets配置指南
 */
function generateGitHubSecretsGuide(secrets) {
    if (secrets.length === 0) {
        console.log(chalk.red('❌ 没有找到任何可提取的API密钥配置'));
        return;
    }

    console.log(chalk.green('📋 GitHub Secrets 配置信息'));
    console.log(chalk.green('═'.repeat(50)));
    console.log();
    
    console.log(chalk.yellow('🔧 在GitHub仓库中配置以下Secrets：'));
    console.log();
    console.log('1. 前往GitHub仓库页面');
    console.log('2. 点击 Settings 选项卡');
    console.log('3. 在左侧菜单选择 Secrets and variables → Actions');
    console.log('4. 点击 "New repository secret" 添加以下配置：');
    console.log();

    secrets.forEach((secret, index) => {
        console.log(chalk.cyan(`${index + 1}. ${secret.name}`));
        console.log(chalk.gray(`   描述: ${secret.description}`));
        console.log(chalk.yellow(`   值: ${secret.value}`));
        console.log();
    });
}

/**
 * 检查.env文件
 */
function checkEnvFile() {
    const envPath = '.env';
    
    if (fs.existsSync(envPath)) {
        console.log(chalk.yellow('📁 发现.env文件'));
        
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n').filter(line => 
                line.trim() && !line.trim().startsWith('#')
            );
            
            console.log(chalk.gray(`   包含 ${lines.length} 行配置`));
            console.log(chalk.gray('   建议将.env文件添加到.gitignore中'));
        } catch (error) {
            console.log(chalk.red('   读取.env文件失败'));
        }
    } else {
        console.log(chalk.yellow('📁 未发现.env文件'));
        console.log(chalk.gray('   环境变量可能通过其他方式配置（系统环境变量等）'));
    }
    console.log();
}

/**
 * 生成一键复制命令
 */
function generateCopyCommands(secrets) {
    if (secrets.length === 0) return;
    
    console.log(chalk.blue('📋 一键复制配置（Windows PowerShell）'));
    console.log(chalk.blue('═'.repeat(50)));
    console.log();
    
    secrets.forEach(secret => {
        console.log(chalk.gray(`# ${secret.description}`));
        console.log(chalk.white(`echo "${secret.value}" | clip`));
        console.log(chalk.gray(`# 然后在GitHub Secrets中添加 ${secret.name}`));
        console.log();
    });
}

/**
 * 生成安全提醒
 */
function generateSecurityWarning() {
    console.log(chalk.red('⚠️ 安全提醒'));
    console.log(chalk.red('═'.repeat(50)));
    console.log();
    console.log(chalk.yellow('🔒 请注意以下安全事项：'));
    console.log('• API密钥是敏感信息，请妥善保管');
    console.log('• 不要在公开场所（如聊天、邮件）分享API密钥');
    console.log('• 如果密钥泄露，请立即重新生成');
    console.log('• 定期检查和更新API密钥');
    console.log('• 确保.env文件已添加到.gitignore');
    console.log();
}

/**
 * 主函数
 */
function main() {
    // 检查.env文件
    checkEnvFile();
    
    // 检查环境变量
    const { extractedSecrets, hasErrors } = checkEnvironmentVariables();
    
    if (hasErrors) {
        console.log(chalk.red('❌ 部分必需的API密钥未配置'));
        console.log(chalk.yellow('💡 请先配置所有必需的API密钥，然后重新运行此脚本'));
        console.log();
        console.log(chalk.cyan('📚 参考配置指南：'));
        console.log('• 运行: pnpm run github-setup');
        console.log('• 查看: env.example 文件');
        process.exit(1);
    }
    
    // 生成GitHub Secrets配置指南
    generateGitHubSecretsGuide(extractedSecrets);
    
    // 生成一键复制命令
    generateCopyCommands(extractedSecrets);
    
    // 安全提醒
    generateSecurityWarning();
    
    console.log(chalk.green('🎉 GitHub Secrets 提取完成！'));
    console.log(chalk.cyan('📋 下一步：将上述信息配置到GitHub仓库的Secrets中'));
}

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = {
    checkEnvironmentVariables,
    generateGitHubSecretsGuide
}; 