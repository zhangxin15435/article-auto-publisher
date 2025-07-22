#!/usr/bin/env node
const XLSX = require('xlsx');
const path = require('path');
const chalk = require('chalk');

/**
 * 创建中文Excel模板文件
 */
function createChineseExcelTemplate() {
    console.log(chalk.blue('🔧 开始创建中文Excel模板...'));

    // 定义模板数据
    const templateData = [
        {
            '主题': 'GitHub Actions自动化发布',
            '发布': '否',
            '提出人': '张三',
            '发布内容': '# GitHub Actions自动化发布\n\n## 简介\n\n本文介绍如何使用GitHub Actions实现自动化发布。\n\n## 主要功能\n\n- 定时自动发布\n- 支持多平台\n- 状态自动更新',
            '格式转换': '是',
            'markdown格标签': 'github,automation,devops',
            '图片': 'https://example.com/cover.jpg',
            '渠道&账号': 'devto,hashnode',
            '发布完成': '否'
        },
        {
            '主题': '表格批量发布功能介绍',
            '发布': '否',
            '提出人': '李四',
            '发布内容': '# 表格批量发布功能\n\n## 功能特点\n\n1. 支持CSV和Excel格式\n2. 自动识别未发布文章\n3. 批量处理多篇文章\n\n## 使用方法\n\n```bash\nnpm run table-publish articles.csv\n```',
            '格式转换': '是',
            'markdown格标签': 'table,batch,productivity',
            '图片': '',
            '渠道&账号': 'devto',
            '发布完成': '否'
        },
        {
            '主题': 'Markdown写作最佳实践',
            '发布': '否',
            '提出人': '王五',
            '发布内容': '# Markdown写作最佳实践\n\n## 为什么选择Markdown\n\nMarkdown是一种轻量级标记语言，非常适合技术写作。\n\n### 优点\n\n- 语法简单\n- 跨平台兼容\n- 版本控制友好',
            '格式转换': '是',
            'markdown格标签': 'markdown,writing,tips',
            '图片': 'https://example.com/markdown.png',
            '渠道&账号': 'hashnode',
            '发布完成': '否'
        }
    ];

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 将数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
    const columnWidths = [
        { wch: 30 }, // 主题
        { wch: 10 }, // 发布
        { wch: 15 }, // 提出人
        { wch: 50 }, // 发布内容
        { wch: 12 }, // 格式转换
        { wch: 25 }, // markdown格标签
        { wch: 30 }, // 图片
        { wch: 20 }, // 渠道&账号
        { wch: 12 }  // 发布完成
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '文章列表');

    // 保存文件
    const outputPath = path.join(__dirname, 'chinese-articles-template.xlsx');
    XLSX.writeFile(workbook, outputPath);

    console.log(chalk.green(`✅ 中文Excel模板创建成功！`));
    console.log(chalk.blue(`📁 文件位置: ${outputPath}`));
    console.log(chalk.yellow('\n📝 模板说明:'));
    console.log('- 主题: 文章标题');
    console.log('- 发布: 是否发布（是/否）');
    console.log('- 提出人: 文章作者');
    console.log('- 发布内容: Markdown格式的文章内容');
    console.log('- 格式转换: 是否需要格式转换（是/否）');
    console.log('- markdown格标签: 用逗号分隔的标签');
    console.log('- 图片: 封面图片URL');
    console.log('- 渠道&账号: 发布平台（devto,hashnode）');
    console.log('- 发布完成: 是否已完成发布（是/否）');
}

// 执行创建模板
createChineseExcelTemplate(); 