#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

// 从环境变量获取配置
require('dotenv').config({ path: './.env' });

class MultiPlatformPublisher {
    constructor() {
        this.config = {
            devto: {
                apiKey: process.env.DEVTO_API_KEY,
                enabled: !!process.env.DEVTO_API_KEY
            },
            hashnode: {
                apiKey: process.env.HASHNODE_API_KEY,
                publicationId: process.env.HASHNODE_PUBLICATION_ID,
                enabled: !!process.env.HASHNODE_API_KEY && !!process.env.HASHNODE_PUBLICATION_ID
            },
            medium: {
                token: process.env.MEDIUM_TOKEN,
                userId: process.env.MEDIUM_USER_ID,
                enabled: !!process.env.MEDIUM_TOKEN && !!process.env.MEDIUM_USER_ID
            },
            hackernews: {
                username: process.env.HN_USERNAME,
                password: process.env.HN_PASSWORD,
                enabled: !!process.env.HN_USERNAME && !!process.env.HN_PASSWORD
            }
        };

        this.articlesDir = '../articles';
        this.results = [];
    }

    // 显示配置状态
    showConfiguration() {
        console.log(chalk.blue('📡 多平台文章发布工具'));
        console.log(chalk.blue('====================================='));
        console.log();

        console.log(chalk.yellow('🔧 平台配置状态:'));

        Object.keys(this.config).forEach(platform => {
            const status = this.config[platform].enabled ?
                chalk.green('✅ 已配置') : chalk.red('❌ 未配置');
            const platformName = this.getPlatformDisplayName(platform);
            console.log(`   ${platformName}: ${status}`);
        });

        console.log();
    }

    // 获取平台显示名称
    getPlatformDisplayName(platform) {
        const names = {
            devto: 'Dev.to',
            hashnode: 'Hashnode',
            medium: 'Medium',
            hackernews: 'Hacker News'
        };
        return names[platform] || platform;
    }

    // 获取文章列表
    getArticles() {
        if (!fs.existsSync(this.articlesDir)) {
            console.error(chalk.red(`❌ 错误: 文章目录 ${this.articlesDir} 不存在`));
            return [];
        }

        const files = fs.readdirSync(this.articlesDir)
            .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
            .map(file => path.join(this.articlesDir, file));

        return files;
    }

    // 解析文章内容
    parseArticle(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data: frontMatter, content } = matter(fileContent);

        return {
            title: frontMatter.title || path.basename(filePath, path.extname(filePath)),
            content: content,
            description: frontMatter.description || '',
            tags: frontMatter.tags || [],
            published: frontMatter.published !== false,
            coverImage: frontMatter.cover_image || frontMatter.coverImage,
            canonicalUrl: frontMatter.canonical_url || frontMatter.canonicalUrl,
            series: frontMatter.series,
            frontMatter: frontMatter
        };
    }

    // 发布到 Dev.to
    async publishToDevTo(article, isDraft = false) {
        if (!this.config.devto.enabled) {
            return { success: false, error: 'Dev.to API 未配置' };
        }

        try {
            const tags = Array.isArray(article.tags) ? article.tags.slice(0, 4) : [];

            // 为避免重复标题，在草稿模式时添加时间戳
            const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
            const title = isDraft ? `${article.title} [测试-${timestamp}]` : article.title;

            const articleData = {
                article: {
                    title: title,
                    body_markdown: article.content,
                    published: !isDraft && article.published,
                    tags: tags,
                    description: article.description,
                    main_image: article.coverImage,
                    canonical_url: article.canonicalUrl,
                    series: article.series
                }
            };

            // 移除 undefined 字段
            Object.keys(articleData.article).forEach(key => {
                if (articleData.article[key] === undefined) {
                    delete articleData.article[key];
                }
            });

            const response = await axios.post('https://dev.to/api/articles', articleData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.devto.apiKey
                },
                timeout: 30000
            });

            return {
                success: true,
                platform: 'Dev.to',
                id: response.data.id,
                url: response.data.url,
                published: response.data.published
            };

        } catch (error) {
            return {
                success: false,
                platform: 'Dev.to',
                error: this.extractErrorMessage(error)
            };
        }
    }

    // 发布到 Hashnode
    async publishToHashnode(article, isDraft = false) {
        if (!this.config.hashnode.enabled) {
            return { success: false, error: 'Hashnode API 未配置' };
        }

        try {
            const mutation = `
                mutation PublishPost($input: PublishPostInput!) {
                    publishPost(input: $input) {
                        post {
                            id
                            slug
                            title
                            url
                        }
                    }
                }
            `;

            // 转换标签格式 - Hashnode 需要对象格式
            const tags = Array.isArray(article.tags) ?
                article.tags.slice(0, 5).map(tag => ({
                    slug: tag.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    name: tag
                })) : [];

            const variables = {
                input: {
                    title: article.title,
                    contentMarkdown: article.content,
                    publicationId: this.config.hashnode.publicationId,
                    tags: tags
                }
            };

            const response = await axios.post('https://gql.hashnode.com/', {
                query: mutation,
                variables: variables
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.config.hashnode.apiKey
                },
                timeout: 30000
            });

            if (response.data.errors) {
                throw new Error(response.data.errors.map(e => e.message).join(', '));
            }

            const post = response.data.data.publishPost.post;

            return {
                success: true,
                platform: 'Hashnode',
                id: post.id,
                url: post.url,
                published: true
            };

        } catch (error) {
            return {
                success: false,
                platform: 'Hashnode',
                error: this.extractErrorMessage(error)
            };
        }
    }

    // 发布到 Medium (API方式，如果有token)
    async publishToMedium(article, isDraft = false) {
        if (!this.config.medium.enabled) {
            return { success: false, error: 'Medium API 未配置（或已停止支持新用户）' };
        }

        try {
            const postData = {
                title: article.title,
                contentFormat: 'markdown',
                content: article.content,
                publishStatus: isDraft ? 'draft' : 'published',
                tags: Array.isArray(article.tags) ? article.tags : []
            };

            const response = await axios.post(
                `https://api.medium.com/v1/users/${this.config.medium.userId}/posts`,
                postData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.medium.token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return {
                success: true,
                platform: 'Medium',
                id: response.data.data.id,
                url: response.data.data.url,
                published: response.data.data.publishStatus === 'published'
            };

        } catch (error) {
            return {
                success: false,
                platform: 'Medium',
                error: this.extractErrorMessage(error)
            };
        }
    }

    // 生成 Hacker News 提交链接
    generateHackerNewsLink(article) {
        if (!this.config.hackernews.enabled) {
            return { success: false, error: 'Hacker News 账号未配置' };
        }

        // 如果文章有 canonical URL，使用它，否则生成一个占位符
        const url = article.canonicalUrl || 'https://example.com/your-article-url';
        const title = encodeURIComponent(article.title);
        const submitUrl = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${title}`;

        return {
            success: true,
            platform: 'Hacker News',
            submitUrl: submitUrl,
            instructions: '请手动访问以下链接提交到 Hacker News',
            note: '需要手动登录并提交，因为 HN 没有官方 API'
        };
    }

    // 提取错误信息
    extractErrorMessage(error) {
        if (error.response) {
            if (error.response.data && error.response.data.error) {
                return `HTTP ${error.response.status}: ${error.response.data.error}`;
            }
            return `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            return '网络连接失败';
        } else {
            return error.message;
        }
    }

    // 发布到指定平台
    async publishToPlatform(platform, article, isDraft = false) {
        console.log(chalk.cyan(`🔄 正在发布到 ${this.getPlatformDisplayName(platform)}...`));

        let result;
        switch (platform) {
            case 'devto':
                result = await this.publishToDevTo(article, isDraft);
                break;
            case 'hashnode':
                result = await this.publishToHashnode(article, isDraft);
                break;
            case 'medium':
                result = await this.publishToMedium(article, isDraft);
                break;
            case 'hackernews':
                result = this.generateHackerNewsLink(article);
                break;
            default:
                result = { success: false, error: `未知平台: ${platform}` };
        }

        if (result.success) {
            console.log(chalk.green(`✅ ${this.getPlatformDisplayName(platform)} 发布成功`));
            if (result.url) console.log(chalk.blue(`   🔗 链接: ${result.url}`));
            if (result.submitUrl) console.log(chalk.blue(`   🔗 提交链接: ${result.submitUrl}`));
            if (result.instructions) console.log(chalk.yellow(`   📋 说明: ${result.instructions}`));
        } else {
            console.log(chalk.red(`❌ ${this.getPlatformDisplayName(platform)} 发布失败: ${result.error}`));
        }

        return result;
    }

    // 发布文章到多个平台
    async publishArticle(filePath, platforms = [], isDraft = false) {
        console.log(chalk.yellow(`\n📝 正在处理文章: ${path.basename(filePath)}`));

        try {
            const article = this.parseArticle(filePath);
            console.log(chalk.blue(`   标题: ${article.title}`));
            console.log(chalk.blue(`   标签: ${Array.isArray(article.tags) ? article.tags.join(', ') : article.tags}`));
            console.log(chalk.blue(`   内容长度: ${article.content.length} 字符`));
            console.log(chalk.blue(`   发布模式: ${isDraft ? '草稿' : '正式发布'}`));

            const results = [];

            // 如果没有指定平台，发布到所有已配置的平台
            if (platforms.length === 0) {
                platforms = Object.keys(this.config).filter(p => this.config[p].enabled);
            }

            console.log(chalk.blue(`   目标平台: ${platforms.map(p => this.getPlatformDisplayName(p)).join(', ')}`));

            // 依次发布到各个平台
            for (const platform of platforms) {
                if (!this.config[platform] || !this.config[platform].enabled) {
                    console.log(chalk.yellow(`⚠️ ${this.getPlatformDisplayName(platform)} 未配置，跳过`));
                    continue;
                }

                const result = await this.publishToPlatform(platform, article, isDraft);
                result.platform = this.getPlatformDisplayName(platform);
                results.push(result);

                // 在请求之间添加延迟，避免频率限制
                if (platform !== platforms[platforms.length - 1]) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            return {
                article: article.title,
                results: results
            };

        } catch (error) {
            console.error(chalk.red(`❌ 处理文章失败: ${error.message}`));
            return {
                article: path.basename(filePath),
                error: error.message
            };
        }
    }

    // 显示发布结果摘要
    showSummary(results) {
        console.log(chalk.blue('\n📊 发布结果摘要'));
        console.log(chalk.blue('====================================='));

        results.forEach(articleResult => {
            console.log(chalk.yellow(`\n📝 ${articleResult.article}`));

            if (articleResult.error) {
                console.log(chalk.red(`   ❌ 处理失败: ${articleResult.error}`));
                return;
            }

            articleResult.results.forEach(result => {
                if (result.success) {
                    console.log(chalk.green(`   ✅ ${result.platform}: 成功`));
                    if (result.url) console.log(chalk.blue(`      🔗 ${result.url}`));
                    if (result.submitUrl) console.log(chalk.blue(`      🔗 ${result.submitUrl}`));
                } else {
                    console.log(chalk.red(`   ❌ ${result.platform}: ${result.error}`));
                }
            });
        });

        // 统计信息
        const totalArticles = results.length;
        const successfulArticles = results.filter(r => !r.error).length;
        const totalPublications = results.reduce((sum, r) =>
            sum + (r.results ? r.results.filter(result => result.success).length : 0), 0
        );

        console.log(chalk.blue('\n📈 统计信息:'));
        console.log(chalk.blue(`   📄 处理文章: ${successfulArticles}/${totalArticles}`));
        console.log(chalk.blue(`   🚀 成功发布: ${totalPublications} 次`));
    }

    // 主运行方法
    async run() {
        // 解析命令行参数
        const args = process.argv.slice(2);
        const isDraft = args.includes('--draft');
        const platformsArg = args.find(arg => arg.startsWith('--platforms='));
        const fileArg = args.find(arg => arg.startsWith('--file='));

        let platforms = [];
        if (platformsArg) {
            platforms = platformsArg.split('=')[1].split(',');
        }

        this.showConfiguration();

        // 获取要发布的文章
        let articles = [];
        if (fileArg) {
            const fileName = fileArg.split('=')[1];
            const filePath = path.join(this.articlesDir, fileName);
            if (fs.existsSync(filePath)) {
                articles = [filePath];
            } else {
                console.error(chalk.red(`❌ 文件不存在: ${fileName}`));
                return;
            }
        } else {
            articles = this.getArticles();
        }

        if (articles.length === 0) {
            console.log(chalk.yellow('⚠️ 未找到任何文章文件'));
            console.log('请在 articles 目录中添加 .md 或 .markdown 文件');
            return;
        }

        console.log(chalk.green(`\n📚 找到 ${articles.length} 个文章文件:`));
        articles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${path.basename(file)}`);
        });

        // 确认发布
        if (!args.includes('--yes')) {
            console.log(chalk.yellow('\n⚠️ 准备发布文章，请确认:'));
            console.log(`   📄 文章数量: ${articles.length}`);
            console.log(`   🎯 目标平台: ${platforms.length > 0 ? platforms.map(p => this.getPlatformDisplayName(p)).join(', ') : '所有已配置平台'}`);
            console.log(`   📊 发布模式: ${isDraft ? '草稿' : '正式发布'}`);
            console.log(chalk.yellow('\n添加 --yes 参数可跳过确认'));

            // 在实际项目中，这里可以添加用户确认输入
            console.log(chalk.green('\n🚀 开始发布...'));
        }

        // 发布文章
        const results = [];
        for (const articlePath of articles) {
            const result = await this.publishArticle(articlePath, platforms, isDraft);
            results.push(result);
        }

        // 显示结果摘要
        this.showSummary(results);

        console.log(chalk.green('\n🎉 发布完成！'));
        this.showUsageInstructions();
    }

    // 显示使用说明
    showUsageInstructions() {
        console.log(chalk.blue('\n📋 使用说明:'));
        console.log('');
        console.log('基本用法:');
        console.log('  node multi-platform-publisher.js                    # 发布所有文章到所有平台');
        console.log('  node multi-platform-publisher.js --draft            # 发布为草稿');
        console.log('  node multi-platform-publisher.js --yes              # 跳过确认');
        console.log('');
        console.log('指定平台:');
        console.log('  --platforms=devto,hashnode                          # 只发布到指定平台');
        console.log('  --platforms=devto                                    # 只发布到 Dev.to');
        console.log('');
        console.log('指定文章:');
        console.log('  --file=example-article.md                           # 只发布指定文章');
        console.log('');
        console.log('组合使用:');
        console.log('  node multi-platform-publisher.js --file=test.md --platforms=devto --draft --yes');
        console.log('');
        console.log('支持的平台: devto, hashnode, medium, hackernews');
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const publisher = new MultiPlatformPublisher();
    publisher.run().catch(console.error);
}

module.exports = MultiPlatformPublisher; 