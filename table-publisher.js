#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const TablePublisher = require('./src/tablePublisher');

/**
 * 表格发布器命令行入口
 */
async function main() {
    console.log(chalk.blue('📊 多平台文章表格发布工具'));
    console.log(chalk.blue('═'.repeat(50)));
    console.log(chalk.cyan('支持从CSV/Excel文件批量发布文章到DEV.to和Hashnode'));
    console.log();

    const args = process.argv.slice(2);

    // 显示帮助信息
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    // 显示版本信息
    if (args.includes('--version') || args.includes('-v')) {
        const packageJson = require('./package.json');
        console.log(`版本: ${packageJson.version}`);
        return;
    }

    const tablePath = args[0];
    const options = parseOptions(args);

    try {
        // 检查文件路径
        if (!tablePath) {
            console.log(chalk.red('❌ 错误: 请提供表格文件路径'));
            showUsage();
            process.exit(1);
        }

        // 解析相对路径
        const fullPath = path.resolve(tablePath);

        console.log(chalk.yellow(`📄 表格文件: ${path.basename(fullPath)}`));
        console.log(chalk.yellow(`📂 完整路径: ${fullPath}`));
        console.log();

        // 创建发布器实例
        const publisher = new TablePublisher();

        // 开始发布
        const result = await publisher.publish(fullPath, options);

        if (result.success) {
            console.log(chalk.green('\n🎉 表格发布完成！'));

            // 显示发布统计
            if (result.publishedCount > 0) {
                console.log(chalk.cyan(`✅ 成功发布 ${result.publishedCount} 篇文章`));
            } else {
                console.log(chalk.yellow('ℹ️ 没有新文章需要发布'));
            }
        } else {
            console.log(chalk.red('\n💥 表格发布失败！'));
            console.log(chalk.red(`错误: ${result.error}`));
            process.exit(1);
        }

    } catch (error) {
        console.error(chalk.red(`\n💥 发布失败: ${error.message}`));

        if (error.code === 'ENOENT') {
            console.log(chalk.yellow(`💡 请检查文件路径是否正确: ${tablePath}`));
            console.log(chalk.yellow('   支持的文件格式: .csv, .xlsx, .xls'));
        }

        process.exit(1);
    }
}

/**
 * 解析命令行选项
 * @param {Array} args - 命令行参数
 * @returns {Object} 选项对象
 */
function parseOptions(args) {
    const options = {
        draft: false,
        autoConfirm: false,
        forceAll: false,
        forceRepublish: false
    };

    for (const arg of args) {
        switch (arg) {
            case '--draft':
                options.draft = true;
                break;
            case '--yes':
            case '-y':
                options.autoConfirm = true;
                break;
            case '--force-all':
                options.forceAll = true;
                break;
            case '--force-republish':
                options.forceRepublish = true;
                break;
        }
    }

    return options;
}

/**
 * 显示使用说明
 */
function showUsage() {
    console.log(chalk.yellow('\n用法: node table-publisher.js <表格文件路径> [选项]'));
    console.log(chalk.yellow('   或: npm run table-publish <表格文件路径> [选项]'));
}

/**
 * 显示完整帮助信息
 */
function showHelp() {
    showUsage();

    console.log(chalk.cyan('\n选项:'));
    console.log('  --draft              发布为草稿模式');
    console.log('  --yes, -y            跳过确认提示，自动发布');
    console.log('  --force-all          发布所有文章（包括已发布的）');
    console.log('  --force-republish    强制重新发布到已发布的平台');
    console.log('  --help, -h           显示帮助信息');
    console.log('  --version, -v        显示版本信息');

    console.log(chalk.cyan('\n支持的文件格式:'));
    console.log('  • CSV文件 (.csv)');
    console.log('  • Excel文件 (.xlsx, .xls)');

    console.log(chalk.cyan('\n示例:'));
    console.log('  node table-publisher.js articles.csv');
    console.log('  node table-publisher.js articles.xlsx --draft --yes');
    console.log('  node table-publisher.js data/articles.csv --force-all');

    console.log(chalk.cyan('\n表格格式要求:'));
    console.log('  必需列: title (标题)');
    console.log('  可选列: description, tags, content, file_path, cover_image');
    console.log('  状态列: devto_published, hashnode_published');
    console.log('  查看模板: templates/articles-template.csv 或 templates/articles-template.xlsx');

    console.log(chalk.cyan('\n配置要求:'));
    console.log('  1. 复制 env.example 为 .env');
    console.log('  2. 配置 DEVTO_API_KEY（DEV.to API密钥）');
    console.log('  3. 配置 HASHNODE_API_KEY 和 HASHNODE_PUBLICATION_ID（Hashnode配置）');

    console.log(chalk.cyan('\n更多信息:'));
    console.log('  • 文档: 查看 README.md 和相关说明文档');
    console.log('  • 模板: templates/ 目录中的示例文件');
    console.log('  • 配置: 运行 node setup-platforms.js 进行配置向导');
}

// 运行主程序
if (require.main === module) {
    main().catch(error => {
        console.error(chalk.red('程序运行出错:'), error);
        process.exit(1);
    });
}

module.exports = { main, parseOptions }; 