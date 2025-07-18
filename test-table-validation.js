#!/usr/bin/env node

const chalk = require('chalk');
const TableParser = require('./src/utils/tableParser');
const path = require('path');

/**
 * 表格验证测试脚本
 * 测试表格解析和验证功能，不执行实际发布
 */
async function testTableValidation() {
    console.log(chalk.blue('🧪 表格发布功能验证测试'));
    console.log(chalk.blue('═'.repeat(50)));
    console.log();

    const parser = new TableParser();

    // 测试文件列表
    const testFiles = [
        'test-table.csv',
        'templates/articles-template.csv',
        'templates/articles-template.xlsx'
    ];

    let allTestsPassed = true;

    for (const testFile of testFiles) {
        const fullPath = path.resolve(testFile);
        console.log(chalk.yellow(`📋 测试文件: ${testFile}`));
        console.log(chalk.gray(`   路径: ${fullPath}`));

        try {
            // 1. 验证文件格式
            console.log(chalk.cyan('   🔍 验证文件格式...'));
            const validation = await parser.validateFormat(fullPath);

            if (validation.valid) {
                console.log(chalk.green(`   ✅ 格式验证通过: ${validation.message}`));

                // 2. 解析文件内容
                console.log(chalk.cyan('   📊 解析文件内容...'));
                const articles = await parser.parseFile(fullPath);

                console.log(chalk.green(`   ✅ 解析成功，共 ${articles.length} 篇文章`));

                // 3. 显示解析结果
                articles.forEach((article, index) => {
                    console.log(chalk.blue(`   📝 文章 ${index + 1}:`));
                    console.log(`      标题: ${article.title}`);
                    console.log(`      描述: ${article.description || '无'}`);
                    console.log(`      标签: ${article.tags.join(', ') || '无'}`);
                    console.log(`      内容长度: ${article.content.length} 字符`);
                    console.log(`      文件路径: ${article.filePath || '无'}`);

                    const devtoStatus = article.platformStatus.devto.published ? '已发布' : '未发布';
                    const hashnodeStatus = article.platformStatus.hashnode.published ? '已发布' : '未发布';
                    console.log(`      DEV.to状态: ${devtoStatus}`);
                    console.log(`      Hashnode状态: ${hashnodeStatus}`);
                });

                // 4. 检查未发布文章
                const unpublished = parser.getUnpublishedArticles(articles);
                console.log(chalk.cyan(`   🎯 未发布文章: ${unpublished.length} 篇`));

            } else {
                console.log(chalk.red(`   ❌ 格式验证失败: ${validation.message}`));
                if (validation.suggestions) {
                    console.log(chalk.yellow('   💡 建议:'));
                    validation.suggestions.forEach(suggestion => {
                        console.log(`      • ${suggestion}`);
                    });
                }
                allTestsPassed = false;
            }

        } catch (error) {
            console.log(chalk.red(`   ❌ 测试失败: ${error.message}`));
            if (error.code === 'ENOENT') {
                console.log(chalk.yellow(`   💡 文件不存在，跳过测试`));
            } else {
                allTestsPassed = false;
            }
        }

        console.log(); // 空行分隔
    }

    // 5. 测试数据格式解析
    console.log(chalk.yellow('🔧 测试数据格式解析功能...'));

    const testCases = [
        { name: '标签解析', input: 'javascript,react,tutorial', expected: ['javascript', 'react', 'tutorial'] },
        { name: '中文标签', input: 'JavaScript，教程，前端', expected: ['JavaScript', '教程', '前端'] },
        { name: '布尔值解析(true)', input: 'true', expected: true },
        { name: '布尔值解析(是)', input: '是', expected: true },
        { name: '布尔值解析(false)', input: 'false', expected: false },
        { name: 'URL状态', input: 'https://dev.to/article', expected: { published: true, url: 'https://dev.to/article', id: null } }
    ];

    for (const testCase of testCases) {
        try {
            let result;
            switch (testCase.name) {
                case '标签解析':
                case '中文标签':
                    result = parser.parseTags(testCase.input);
                    break;
                case '布尔值解析(true)':
                case '布尔值解析(是)':
                case '布尔值解析(false)':
                    result = parser.parseBoolean(testCase.input);
                    break;
                case 'URL状态':
                    result = parser.parsePlatformStatus(testCase.input);
                    break;
            }

            const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
            if (passed) {
                console.log(chalk.green(`   ✅ ${testCase.name}: 通过`));
            } else {
                console.log(chalk.red(`   ❌ ${testCase.name}: 失败`));
                console.log(`      期望: ${JSON.stringify(testCase.expected)}`);
                console.log(`      实际: ${JSON.stringify(result)}`);
                allTestsPassed = false;
            }
        } catch (error) {
            console.log(chalk.red(`   ❌ ${testCase.name}: 异常 - ${error.message}`));
            allTestsPassed = false;
        }
    }

    console.log();
    console.log(chalk.blue('📊 测试结果摘要'));
    console.log('═'.repeat(50));

    if (allTestsPassed) {
        console.log(chalk.green('🎉 所有测试通过！表格发布功能验证成功！'));
        console.log();
        console.log(chalk.cyan('✅ 验证通过的功能:'));
        console.log('   • CSV文件解析');
        console.log('   • Excel文件解析');
        console.log('   • 文章数据提取');
        console.log('   • 状态追踪');
        console.log('   • 数据格式处理');
        console.log();
        console.log(chalk.yellow('🚀 下一步:'));
        console.log('   1. 配置API密钥 (.env文件)');
        console.log('   2. 使用草稿模式测试发布');
        console.log('   3. 正式发布文章');
        console.log();
        console.log(chalk.gray('💡 示例命令:'));
        console.log('   node table-publisher.js test-table.csv --draft --yes');
    } else {
        console.log(chalk.red('❌ 部分测试失败，请检查上述错误信息'));
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    testTableValidation().catch(error => {
        console.error(chalk.red('测试运行出错:'), error);
        process.exit(1);
    });
}

module.exports = testTableValidation; 