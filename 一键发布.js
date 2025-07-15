#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🚀 一键发布工具'));
console.log(chalk.blue('====================================='));
console.log();

// 获取命令行参数
const args = process.argv.slice(2);
const isPublish = args.includes('--发布') || args.includes('--publish');
const platform = args.find(arg => arg.startsWith('--平台=') || arg.startsWith('--platforms='));
const file = args.find(arg => arg.startsWith('--文章=') || arg.startsWith('--file='));

// 显示使用说明
function showHelp() {
    console.log(chalk.yellow('📋 使用方法:'));
    console.log();
    console.log(chalk.cyan('🛡️ 安全模式 (草稿发布):'));
    console.log('  node 一键发布.js                          # 所有文章 → 所有平台 (草稿)');
    console.log('  node 一键发布.js --平台=devto              # 所有文章 → Dev.to (草稿)');
    console.log('  node 一键发布.js --文章=test.md            # 指定文章 → 所有平台 (草稿)');
    console.log();
    console.log(chalk.red('🚀 正式发布模式:'));
    console.log('  node 一键发布.js --发布                    # 所有文章 → 所有平台 (正式发布)');
    console.log('  node 一键发布.js --发布 --平台=devto       # 所有文章 → Dev.to (正式发布)');
    console.log('  node 一键发布.js --发布 --文章=test.md     # 指定文章 → 所有平台 (正式发布)');
    console.log();
    console.log(chalk.gray('📝 支持的平台: devto, hashnode, medium, hackernews'));
    console.log(chalk.gray('💡 建议先使用草稿模式测试，确认无误后再正式发布'));
    console.log();
}

// 构建发布命令
function buildCommand() {
    let cmd = 'node multi-platform-publisher.js';

    // 添加草稿参数
    if (!isPublish) {
        cmd += ' --draft';
    }

    // 添加平台参数
    if (platform) {
        const platformValue = platform.split('=')[1];
        cmd += ` --platforms=${platformValue}`;
    }

    // 添加文章参数
    if (file) {
        const fileValue = file.split('=')[1];
        cmd += ` --file=${fileValue}`;
    }

    // 跳过确认
    cmd += ' --yes';

    return cmd;
}

// 执行发布
function executePublish() {
    const command = buildCommand();

    console.log(chalk.yellow('🔧 执行命令:'));
    console.log(chalk.gray(`   ${command}`));
    console.log();

    // 显示发布信息
    console.log(chalk.cyan('📊 发布信息:'));
    console.log(`   📝 模式: ${isPublish ? chalk.red('正式发布') : chalk.green('草稿模式')}`);

    if (platform) {
        const platformValue = platform.split('=')[1];
        console.log(`   🎯 平台: ${chalk.blue(platformValue)}`);
    } else {
        console.log(`   🎯 平台: ${chalk.blue('所有已配置平台')}`);
    }

    if (file) {
        const fileValue = file.split('=')[1];
        console.log(`   📄 文章: ${chalk.blue(fileValue)}`);
    } else {
        console.log(`   📄 文章: ${chalk.blue('所有文章')}`);
    }

    console.log();
    console.log(chalk.green('🚀 开始发布...'));
    console.log(chalk.blue('====================================='));
    console.log();

    // 执行命令
    const cmdParts = command.split(' ');
    const mainCmd = cmdParts[0];
    const cmdArgs = cmdParts.slice(1);

    const child = spawn(mainCmd, cmdArgs, {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.error(chalk.red('❌ 执行失败:'), error.message);
    });

    child.on('close', (code) => {
        console.log();
        if (code === 0) {
            console.log(chalk.green('🎉 发布完成！'));

            if (!isPublish) {
                console.log();
                console.log(chalk.yellow('💡 提示: 这是草稿模式发布'));
                console.log('   📋 查看草稿: 登录各平台后台查看');
                console.log('   🚀 正式发布: 添加 --发布 参数');
            }
        } else {
            console.log(chalk.red('❌ 发布失败'));
        }
    });
}

// 主程序
function main() {
    // 如果没有参数或需要帮助
    if (args.length === 0 || args.includes('--help') || args.includes('--帮助')) {
        showHelp();
        return;
    }

    // 执行发布
    executePublish();
}

// 运行
main(); 