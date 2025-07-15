#!/usr/bin/env node

require('dotenv').config();
const chalk = require('chalk');
const { publishToHashnode } = require('./src/publishers/hashnode');

/**
 * 测试 Hashnode 发布功能
 */
async function testPublish() {
    console.log(chalk.bold.blue('🧪 Hashnode 发布功能测试'));
    console.log('='.repeat(50));

    // 检查环境变量
    const apiKey = process.env.HASHNODE_API_KEY;
    const publicationId = process.env.HASHNODE_PUBLICATION_ID;

    if (!apiKey) {
        console.error(chalk.red('❌ 错误：找不到 HASHNODE_API_KEY 环境变量'));
        console.log(chalk.yellow('请确保 .env 文件存在并包含正确的配置'));
        process.exit(1);
    }

    if (!publicationId || publicationId === 'YOUR_PUBLICATION_ID_HERE') {
        console.error(chalk.red('❌ 错误：HASHNODE_PUBLICATION_ID 未配置或仍为占位符'));
        console.log(chalk.yellow('请编辑 .env 文件，将 YOUR_PUBLICATION_ID_HERE 替换为实际的 Publication ID'));
        console.log(chalk.blue('\n📝 获取 Publication ID 的方法:'));
        console.log('1. 访问 https://hashnode.com');
        console.log('2. 进入您的博客仪表板');
        console.log('3. 从 URL 中复制 Publication ID：https://hashnode.com/[PUBLICATION_ID]/dashboard');
        process.exit(1);
    }

    console.log(chalk.green('✅ 环境变量检查通过'));
    console.log(`API Key: ${apiKey.substring(0, 8)}...`);
    console.log(`Publication ID: ${publicationId}`);

    // 创建测试文章
    const testArticle = {
        title: `测试文章 - ${new Date().toLocaleString('zh-CN')}`,
        content: `# 测试文章

这是一篇测试文章，用于验证 Hashnode 自动发布功能是否正常工作。

## 测试时间
${new Date().toLocaleString('zh-CN')}

## 测试内容

- ✅ 自动发布功能
- ✅ API 连接测试  
- ✅ 文章格式化
- ✅ 中文内容支持

## 代码示例

\`\`\`javascript
function testFunction() {
    console.log('Hello from Hashnode auto-publisher!');
    return true;
}
\`\`\`

## 数学公式测试

简单的数学表达式：$E = mc^2$

## 列表测试

### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 无序列表
- 项目 A
- 项目 B
- 项目 C

**注意：这是一篇测试文章，可以安全删除。**

---

*由 Hashnode 自动发布工具生成*`,
        description: '这是一篇用于测试 Hashnode 自动发布功能的测试文章，包含各种格式测试',
        tags: ['test', 'automation', 'hashnode', '测试']
    };

    const config = {
        apiKey: apiKey,
        publicationId: publicationId
    };

    try {
        console.log(chalk.blue('\n📝 开始发布测试文章...'));
        console.log(`标题: ${chalk.cyan(testArticle.title)}`);

        // 发布为草稿
        const result = await publishToHashnode(testArticle, config, { draft: true });

        console.log(chalk.green('\n🎉 测试发布成功!'));
        console.log('='.repeat(30));
        console.log(`文章ID: ${chalk.yellow(result.id)}`);
        console.log(`状态: ${chalk.green(result.status)}`);
        console.log(`平台: ${chalk.blue(result.platform)}`);
        console.log(`Slug: ${chalk.cyan(result.slug)}`);

        if (result.data && result.data.slug) {
            console.log(chalk.blue('\n🔗 您可以在以下位置查看草稿:'));
            console.log(`https://hashnode.com/draft/${result.data.slug}`);
        }

        console.log(chalk.green('\n✅ Hashnode 自动发布功能正常工作!'));
        console.log(chalk.blue('\n📝 下一步操作:'));
        console.log('1. 访问 Hashnode 查看发布的草稿');
        console.log('2. 使用以下命令发布真实文章:');
        console.log('   npm run publish articles/your-article.md');
        console.log('3. 或者直接发布（非草稿）:');
        console.log('   node src/publisher.js articles/your-article.md');

    } catch (error) {
        console.error(chalk.red('\n❌ 测试发布失败:'));
        console.error(chalk.red(error.message));

        // 提供详细的错误诊断
        if (error.message.includes('API密钥无效')) {
            console.log(chalk.yellow('\n🔍 可能的解决方案:'));
            console.log('1. 检查 API Key 是否正确');
            console.log('2. 确保 API Key 没有过期');
            console.log('3. 重新生成 API Key');
        } else if (error.message.includes('Publication')) {
            console.log(chalk.yellow('\n🔍 可能的解决方案:'));
            console.log('1. 检查 Publication ID 是否正确');
            console.log('2. 确保您有该 Publication 的写入权限');
            console.log('3. 尝试重新获取 Publication ID');
        } else if (error.message.includes('网络')) {
            console.log(chalk.yellow('\n🔍 可能的解决方案:'));
            console.log('1. 检查网络连接');
            console.log('2. 确认可以访问 https://gql.hashnode.com');
            console.log('3. 检查防火墙设置');
        }

        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    testPublish();
}

module.exports = { testPublish }; 