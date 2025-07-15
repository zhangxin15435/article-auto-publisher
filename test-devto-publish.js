const axios = require('axios');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 从环境变量或配置文件中获取 API 密钥
require('dotenv').config({ path: './.env' });

const DEVTO_API_KEY = process.env.DEVTO_API_KEY;
const ARTICLES_DIR = '../articles';

// 获取命令行参数
const args = process.argv.slice(2);
const publishImmediately = args.includes('--publish'); // 添加 --publish 参数可以直接发布

console.log('📡 Dev.to 发布测试工具');
console.log('=====================================');

// 检查配置
if (!DEVTO_API_KEY) {
    console.error('❌ 错误: 未找到 DEVTO_API_KEY 环境变量');
    console.log('请检查 example-implementation/.env 文件配置');
    process.exit(1);
}

console.log('✅ API 密钥已配置');
console.log(`📁 文章目录: ${ARTICLES_DIR}`);
console.log(`📊 发布模式: ${publishImmediately ? '直接发布' : '草稿模式'}`);

// 获取文章列表
function getArticles() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`❌ 错误: 文章目录 ${ARTICLES_DIR} 不存在`);
        return [];
    }

    const files = fs.readdirSync(ARTICLES_DIR)
        .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
        .map(file => path.join(ARTICLES_DIR, file));

    return files;
}

// 发布文章到 Dev.to
async function publishToDevTo(filePath) {
    try {
        console.log(`\n🔄 正在处理文章: ${path.basename(filePath)}`);

        // 读取文章内容
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data: frontMatter, content } = matter(fileContent);

        // 准备文章数据
        const tags = frontMatter.tags || ['test'];
        const limitedTags = Array.isArray(tags) ? tags.slice(0, 4) : [tags]; // Dev.to 最多 4 个标签

        // 为避免重复标题，在测试时添加时间戳
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
        const title = frontMatter.title || '测试文章';
        const testTitle = publishImmediately ? title : `${title} [测试-${timestamp}]`;

        const articleData = {
            article: {
                title: testTitle,
                body_markdown: content,
                published: publishImmediately, // 根据参数决定是否直接发布
                tags: limitedTags,
                description: frontMatter.description || '这是一个测试文章'
            }
        };

        console.log('📝 文章信息:');
        console.log(`   标题: ${articleData.article.title}`);
        console.log(`   标签: ${articleData.article.tags.join(', ')}`);
        console.log(`   内容长度: ${content.length} 字符`);
        console.log(`   发布状态: ${articleData.article.published ? '直接发布' : '草稿'}`);

        // 发送请求到 Dev.to API
        const response = await axios.post('https://dev.to/api/articles', articleData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': DEVTO_API_KEY
            },
            timeout: 30000
        });

        console.log('✅ 发布成功!');
        console.log(`📄 文章ID: ${response.data.id}`);
        console.log(`🔗 文章链接: ${response.data.url}`);
        console.log(`📊 状态: ${response.data.published ? '已发布' : '草稿'}`);

        if (!response.data.published) {
            console.log(`\n💡 提示: 草稿文章无法通过公开链接访问`);
            console.log(`   请登录 Dev.to 后台查看: https://dev.to/dashboard`);
        }

        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error('❌ 发布失败:');

        if (error.response) {
            console.error(`   HTTP状态码: ${error.response.status}`);
            console.error(`   错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            console.error('   网络错误: 请检查网络连接');
        } else {
            console.error(`   错误: ${error.message}`);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

// 主程序
async function main() {
    const articles = getArticles();

    if (articles.length === 0) {
        console.log('⚠️ 未找到任何文章文件');
        console.log('请在 articles 目录中添加 .md 或 .markdown 文件');
        return;
    }

    console.log(`\n📚 找到 ${articles.length} 个文章文件:`);
    articles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${path.basename(file)}`);
    });

    // 测试发布第一个文章
    console.log('\n🚀 开始测试发布...');
    const result = await publishToDevTo(articles[0]);

    if (result.success) {
        console.log('\n🎉 测试完成! Dev.to 发布功能正常');
        console.log('\n📋 使用说明:');
        console.log('• 草稿模式: node test-devto-publish.js');
        console.log('• 直接发布: node test-devto-publish.js --publish');
        console.log('• 查看草稿: 登录 https://dev.to/dashboard');
    } else {
        console.log('\n💥 测试失败! 请检查配置和网络连接');
    }
}

// 运行测试
main().catch(console.error); 