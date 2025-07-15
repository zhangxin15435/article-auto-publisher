#!/usr/bin/env node

/**
 * GitHub Actions 本地测试脚本
 * 
 * 用于在部署到GitHub Actions之前本地测试发布功能
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🧪 GitHub Actions 本地测试'));
console.log(chalk.blue('═'.repeat(50)));
console.log();

/**
 * 检查环境配置
 */
function checkEnvironment() {
    console.log(chalk.yellow('🔍 检查环境配置...'));

    const checks = [
        {
            name: 'DEVTO_API_KEY',
            value: process.env.DEVTO_API_KEY,
            required: true
        },
        {
            name: 'HASHNODE_API_KEY',
            value: process.env.HASHNODE_API_KEY,
            required: true
        },
        {
            name: 'HASHNODE_PUBLICATION_ID',
            value: process.env.HASHNODE_PUBLICATION_ID,
            required: true
        }
    ];

    let allPassed = true;

    checks.forEach(check => {
        const status = check.value ? '✅' : '❌';
        const message = check.value ? '已配置' : '未配置';
        console.log(`   ${status} ${check.name}: ${message}`);

        if (check.required && !check.value) {
            allPassed = false;
        }
    });

    console.log();
    return allPassed;
}

/**
 * 检查项目结构
 */
function checkProjectStructure() {
    console.log(chalk.yellow('📁 检查项目结构...'));

    const requiredFiles = [
        '.github/workflows/auto-publish.yml',
        'scripts/github-actions-publish.js',
        'src/publishers/devto.js',
        'src/publishers/hashnode.js',
        'package.json'
    ];

    const requiredDirs = [
        'articles',
        'src',
        'scripts'
    ];

    let allExists = true;

    // 检查文件
    requiredFiles.forEach(file => {
        const exists = fs.existsSync(file);
        const status = exists ? '✅' : '❌';
        console.log(`   ${status} ${file}`);
        if (!exists) allExists = false;
    });

    // 检查目录
    requiredDirs.forEach(dir => {
        const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
        const status = exists ? '✅' : '❌';
        console.log(`   ${status} ${dir}/`);
        if (!exists) allExists = false;
    });

    console.log();
    return allExists;
}

/**
 * 检查文章
 */
function checkArticles() {
    console.log(chalk.yellow('📝 检查文章文件...'));

    const articlesDir = 'articles';

    if (!fs.existsSync(articlesDir)) {
        console.log('   ❌ articles 目录不存在');
        return false;
    }

    const files = fs.readdirSync(articlesDir)
        .filter(file => file.endsWith('.md'));

    if (files.length === 0) {
        console.log('   ⚠️ 未发现任何.md文章文件');
        return false;
    }

    console.log(`   ✅ 发现 ${files.length} 篇文章:`);
    files.forEach(file => {
        console.log(`      - ${file}`);
    });

    console.log();
    return true;
}

/**
 * 检查依赖
 */
function checkDependencies() {
    console.log(chalk.yellow('📦 检查项目依赖...'));

    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['axios', 'dotenv', 'gray-matter', 'chalk'];

        let allInstalled = true;

        requiredDeps.forEach(dep => {
            const installed = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
            const status = installed ? '✅' : '❌';
            console.log(`   ${status} ${dep}${installed ? ` (${installed})` : ''}`);
            if (!installed) allInstalled = false;
        });

        // 检查node_modules
        const nodeModulesExists = fs.existsSync('node_modules');
        console.log(`   ${nodeModulesExists ? '✅' : '❌'} node_modules 目录`);

        console.log();
        return allInstalled && nodeModulesExists;
    } catch (error) {
        console.log('   ❌ 读取package.json失败');
        console.log();
        return false;
    }
}

/**
 * 测试脚本执行
 */
async function testScript() {
    console.log(chalk.yellow('🚀 测试发布脚本...'));

    try {
        // 动态导入发布脚本
        const GitHubActionsPublisher = require('./github-actions-publish.js');

        console.log('   ✅ 发布脚本加载成功');
        console.log('   ℹ️ 可以执行以下命令进行实际测试:');
        console.log('      node scripts/github-actions-publish.js --draft');
        console.log('      node scripts/github-actions-publish.js --platforms=devto --draft');
        console.log();

        return true;
    } catch (error) {
        console.log('   ❌ 发布脚本加载失败:', error.message);
        console.log();
        return false;
    }
}

/**
 * 生成测试报告
 */
function generateReport(results) {
    console.log(chalk.blue('📊 测试报告'));
    console.log(chalk.blue('═'.repeat(50)));

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;

    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ 通过' : '❌ 失败';
        console.log(`${status} ${test}`);
    });

    console.log();
    console.log(`总计: ${passedTests}/${totalTests} 项测试通过`);

    if (passedTests === totalTests) {
        console.log(chalk.green('🎉 所有测试通过！可以部署到GitHub Actions'));
        console.log();
        console.log(chalk.cyan('📋 下一步操作:'));
        console.log('1. 确保已配置GitHub Secrets');
        console.log('2. 推送代码到GitHub仓库');
        console.log('3. 在Actions页面查看工作流执行情况');
        console.log('4. 可以手动触发工作流进行首次测试');
    } else {
        console.log(chalk.red('⚠️ 部分测试失败，请解决问题后重新测试'));
        console.log();
        console.log(chalk.cyan('🔧 解决建议:'));

        if (!results['环境配置']) {
            console.log('- 创建.env文件并配置API密钥');
            console.log('- 参考env.example文件格式');
        }

        if (!results['项目结构']) {
            console.log('- 确保所有必需文件和目录存在');
            console.log('- 检查文件路径是否正确');
        }

        if (!results['文章文件']) {
            console.log('- 在articles目录中添加.md文章文件');
            console.log('- 确保文章包含正确的Front Matter');
        }

        if (!results['项目依赖']) {
            console.log('- 运行 pnpm install 安装依赖');
            console.log('- 检查package.json中的依赖配置');
        }

        if (!results['脚本测试']) {
            console.log('- 检查发布脚本语法错误');
            console.log('- 确保所有导入模块存在');
        }
    }

    console.log();
}

/**
 * 主测试流程
 */
async function runTests() {
    const results = {
        '环境配置': checkEnvironment(),
        '项目结构': checkProjectStructure(),
        '文章文件': checkArticles(),
        '项目依赖': checkDependencies(),
        '脚本测试': await testScript()
    };

    generateReport(results);

    // 设置退出码
    const allPassed = Object.values(results).every(Boolean);
    process.exit(allPassed ? 0 : 1);
}

// 执行测试
if (require.main === module) {
    runTests().catch(error => {
        console.error(chalk.red('❌ 测试过程中发生错误:'), error);
        process.exit(1);
    });
}

module.exports = {
    checkEnvironment,
    checkProjectStructure,
    checkArticles,
    checkDependencies,
    testScript
}; 