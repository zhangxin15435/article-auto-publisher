#!/usr/bin/env node

/**
 * 文章解析演示脚本
 * 展示项目如何区分和处理标题与正文
 */

const matter = require('gray-matter');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('📝 文章格式解析演示'));
console.log(chalk.blue('═'.repeat(50)));
console.log();

/**
 * 演示1：标准文章解析
 */
function demo1() {
    console.log(chalk.yellow('📋 演示1: 标准文章解析'));
    console.log();

    const articleContent = `---
title: "JavaScript异步编程指南"
description: "深入理解Promise和async/await"
tags: ["javascript", "async", "tutorial"]
published: true
cover_image: "https://example.com/cover.jpg"
---

# JavaScript异步编程指南

JavaScript异步编程是现代Web开发的核心技能。

## Promise简介

Promise是ES6引入的异步编程解决方案...

\`\`\`javascript
const promise = new Promise((resolve, reject) => {
    // 异步操作
});
\`\`\`

## async/await语法

async/await是Promise的语法糖...`;

    const parsed = matter(articleContent);

    console.log(chalk.green('解析结果:'));
    console.log(chalk.cyan('标题:'), parsed.data.title);
    console.log(chalk.cyan('描述:'), parsed.data.description);
    console.log(chalk.cyan('标签:'), parsed.data.tags);
    console.log(chalk.cyan('发布状态:'), parsed.data.published);
    console.log(chalk.cyan('封面图:'), parsed.data.cover_image);
    console.log();
    console.log(chalk.cyan('正文长度:'), parsed.content.length, '字符');
    console.log(chalk.cyan('正文开头:'));
    console.log(chalk.gray(parsed.content.split('\n').slice(0, 5).join('\n')));
    console.log();
}

/**
 * 演示2：不同标题情况的处理
 */
function demo2() {
    console.log(chalk.yellow('📋 演示2: 标题处理优先级'));
    console.log();

    // 情况1：有title字段
    const case1 = `---
title: "我的技术文章"
description: "技术分享"
---

# 正文中的标题

这是正文内容...`;

    // 情况2：无title字段，使用文件名
    const case2 = `---
description: "技术分享"
tags: ["tech"]
---

# 正文中的标题

这是正文内容...`;

    function parseWithFallback(content, filename) {
        const { data: frontMatter, content: articleContent } = matter(content);
        return {
            title: frontMatter.title || path.basename(filename, '.md'),
            description: frontMatter.description || '',
            content: articleContent,
            frontMatter: frontMatter
        };
    }

    console.log(chalk.green('情况1: 有title字段'));
    const result1 = parseWithFallback(case1, 'test-article.md');
    console.log(chalk.cyan('  最终标题:'), result1.title);
    console.log(chalk.gray('  来源: Front Matter'));
    console.log();

    console.log(chalk.green('情况2: 无title字段，使用文件名'));
    const result2 = parseWithFallback(case2, 'javascript-async-guide.md');
    console.log(chalk.cyan('  最终标题:'), result2.title);
    console.log(chalk.gray('  来源: 文件名'));
    console.log();
}

/**
 * 演示3：发布到不同平台时的数据处理
 */
function demo3() {
    console.log(chalk.yellow('📋 演示3: 平台发布数据格式'));
    console.log();

    const article = {
        title: "Vue.js组件通信详解",
        description: "全面解析Vue.js组件间的通信方式",
        content: `# Vue.js组件通信详解

Vue.js中组件通信是核心概念之一...

## Props传递

父组件向子组件传递数据...

\`\`\`vue
<template>
  <child-component :message="parentMessage" />
</template>
\`\`\``,
        tags: ["vue", "javascript", "frontend"],
        published: true
    };

    console.log(chalk.green('Dev.to 平台数据格式:'));
    const devtoData = {
        article: {
            title: article.title,                    // 标题单独字段
            body_markdown: article.content,          // 正文作为Markdown
            published: article.published,
            tags: article.tags,
            description: article.description
        }
    };
    console.log(chalk.cyan('  title:'), devtoData.article.title);
    console.log(chalk.cyan('  body_markdown:'), `${devtoData.article.body_markdown.length}字符`);
    console.log(chalk.cyan('  tags:'), devtoData.article.tags);
    console.log();

    console.log(chalk.green('Hashnode 平台数据格式:'));
    const hashnodeData = {
        input: {
            title: article.title,                    // 标题单独字段
            contentMarkdown: article.content,        // 正文作为Markdown
            tags: article.tags.map(tag => ({
                slug: tag.toLowerCase(),
                name: tag
            })),
            subtitle: article.description
        }
    };
    console.log(chalk.cyan('  title:'), hashnodeData.input.title);
    console.log(chalk.cyan('  contentMarkdown:'), `${hashnodeData.input.contentMarkdown.length}字符`);
    console.log(chalk.cyan('  tags:'), hashnodeData.input.tags);
    console.log();
}

/**
 * 演示4：Markdown正文处理
 */
function demo4() {
    console.log(chalk.yellow('📋 演示4: Markdown正文处理'));
    console.log();

    const markdownContent = `# 主标题

这是一个包含多种Markdown元素的正文示例。

## 二级标题

### 代码示例

\`\`\`javascript
function hello() {
    console.log('Hello World');
}
\`\`\`

### 列表示例

1. 有序列表项1
2. 有序列表项2

- 无序列表项1
- 无序列表项2

### 链接和图片

[GitHub](https://github.com)
![示例图片](https://example.com/image.jpg)

### 文本格式

**粗体文本** 和 *斜体文本* 以及 \`行内代码\`。

> 这是一个引用块
> 可以包含多行内容`;

    console.log(chalk.green('原始Markdown内容:'));
    console.log(chalk.gray(markdownContent));
    console.log();

    console.log(chalk.green('内容统计:'));
    const lines = markdownContent.split('\n');
    const headings = lines.filter(line => line.startsWith('#'));
    const codeBlocks = markdownContent.match(/```[\s\S]*?```/g) || [];

    console.log(chalk.cyan('  总行数:'), lines.length);
    console.log(chalk.cyan('  标题数量:'), headings.length);
    console.log(chalk.cyan('  代码块数量:'), codeBlocks.length);
    console.log(chalk.cyan('  字符总数:'), markdownContent.length);
    console.log();
}

/**
 * 演示5：实际项目文件解析
 */
function demo5() {
    console.log(chalk.yellow('📋 演示5: 实际项目文件解析'));
    console.log();

    const fs = require('fs');

    try {
        // 解析示例文章
        const examplePath = 'articles/example-article.md';
        const testPath = 'articles/测试.md';

        if (fs.existsSync(examplePath)) {
            console.log(chalk.green(`解析文件: ${examplePath}`));
            const content = fs.readFileSync(examplePath, 'utf8');
            const parsed = matter(content);

            console.log(chalk.cyan('  标题:'), parsed.data.title);
            console.log(chalk.cyan('  标签:'), parsed.data.tags);
            console.log(chalk.cyan('  正文长度:'), parsed.content.length);
            console.log();
        }

        if (fs.existsSync(testPath)) {
            console.log(chalk.green(`解析文件: ${testPath}`));
            const content = fs.readFileSync(testPath, 'utf8');
            const parsed = matter(content);

            console.log(chalk.cyan('  标题:'), parsed.data.title);
            console.log(chalk.cyan('  标签:'), parsed.data.tags);
            console.log(chalk.cyan('  正文长度:'), parsed.content.length);
            console.log();
        }

    } catch (error) {
        console.log(chalk.red('读取文件时出错:'), error.message);
    }
}

/**
 * 主函数
 */
function main() {
    demo1();
    console.log();

    demo2();
    console.log();

    demo3();
    console.log();

    demo4();
    console.log();

    demo5();

    console.log(chalk.blue('🎯 总结'));
    console.log(chalk.blue('═'.repeat(50)));
    console.log();
    console.log('1. 项目使用 gray-matter 库自动分离 Front Matter 和 Markdown 内容');
    console.log('2. 标题优先从 Front Matter 的 title 字段获取，备用方案是文件名');
    console.log('3. 正文内容支持完整的 Markdown 语法');
    console.log('4. 不同平台使用相同的标题和正文，但数据格式略有不同');
    console.log('5. Front Matter 中可以配置标签、描述、发布状态等元数据');
    console.log();
    console.log(chalk.green('✅ 演示完成！'));
}

// 执行演示
if (require.main === module) {
    main();
}

module.exports = { demo1, demo2, demo3, demo4, demo5 }; 