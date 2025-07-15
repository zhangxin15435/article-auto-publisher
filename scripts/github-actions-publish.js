#!/usr/bin/env node

/**
 * GitHub Actions 专用的文章自动发布脚本
 * 
 * 功能：
 * - 自动检测文章文件
 * - 支持指定平台发布（devto, hashnode）
 * - 支持草稿模式
 * - 生成详细的发布日志
 * - 适配CI/CD环境
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 导入发布器
const { publishToDevTo } = require('../src/publishers/devto');
const { publishToHashnode } = require('../src/publishers/hashnode');

class GitHubActionsPublisher {
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
            }
        };

        this.options = this.parseArguments();
        this.results = [];
        this.articlesDir = path.join(__dirname, '../articles');
    }

    /**
     * 解析命令行参数
     */
    parseArguments() {
        const args = process.argv.slice(2);
        const options = {
            platforms: ['devto', 'hashnode'], // 默认发布到所有平台
            draft: false,
            specificFile: null
        };

        args.forEach(arg => {
            if (arg.startsWith('--platforms=')) {
                const platforms = arg.split('=')[1].split(',').map(p => p.trim());
                options.platforms = platforms;
            } else if (arg === '--draft') {
                options.draft = true;
            } else if (arg.startsWith('--file=')) {
                options.specificFile = arg.split('=')[1];
            }
        });

        return options;
    }

    /**
     * 显示配置状态
     */
    showConfiguration() {
        console.log('🔧 平台配置状态:');

        this.options.platforms.forEach(platform => {
            const status = this.config[platform]?.enabled ? '✅ 已配置' : '❌ 未配置';
            console.log(`   ${platform.toUpperCase()}: ${status}`);
        });

        console.log(`📝 发布模式: ${this.options.draft ? '草稿模式' : '正式发布'}`);

        if (this.options.specificFile) {
            console.log(`📖 指定文章: ${this.options.specificFile}`);
        }

        console.log('');
    }

    /**
     * 获取待发布的文章列表
     */
    getArticlesToPublish() {
        try {
            if (!fs.existsSync(this.articlesDir)) {
                console.log('❌ articles 目录不存在');
                return [];
            }

            let files = [];

            if (this.options.specificFile) {
                // 发布指定文章
                const filePath = path.join(this.articlesDir, this.options.specificFile);
                if (fs.existsSync(filePath)) {
                    files = [this.options.specificFile];
                } else {
                    console.log(`❌ 指定的文章文件不存在: ${this.options.specificFile}`);
                    return [];
                }
            } else {
                // 获取所有markdown文件
                files = fs.readdirSync(this.articlesDir)
                    .filter(file => file.endsWith('.md'));
            }

            if (files.length === 0) {
                console.log('⚠️ 未发现任何待发布的文章');
                return [];
            }

            console.log(`📚 发现 ${files.length} 篇文章待发布:`);
            files.forEach(file => console.log(`   - ${file}`));
            console.log('');

            return files;
        } catch (error) {
            console.error('❌ 获取文章列表时出错:', error.message);
            return [];
        }
    }

    /**
     * 解析文章文件
     */
    parseArticle(filePath) {
        try {
            const fullPath = path.join(this.articlesDir, filePath);
            const fileContent = fs.readFileSync(fullPath, 'utf8');
            const { data: frontMatter, content } = matter(fileContent);

            return {
                filename: filePath,
                title: frontMatter.title || path.basename(filePath, '.md'),
                description: frontMatter.description || '',
                content: content,
                tags: frontMatter.tags || [],
                published: frontMatter.published !== false,
                coverImage: frontMatter.cover_image || frontMatter.coverImage,
                canonicalUrl: frontMatter.canonical_url || frontMatter.canonicalUrl,
                frontMatter: frontMatter
            };
        } catch (error) {
            throw new Error(`解析文章 ${filePath} 时出错: ${error.message}`);
        }
    }

    /**
     * 发布到指定平台
     */
    async publishToPlatform(article, platform) {
        try {
            if (!this.config[platform].enabled) {
                return {
                    success: false,
                    platform: platform.toUpperCase(),
                    error: `${platform.toUpperCase()} 未配置或配置不完整`
                };
            }

            let result;
            switch (platform) {
                case 'devto':
                    result = await publishToDevTo(article, this.config.devto, {
                        draft: this.options.draft
                    });
                    break;

                case 'hashnode':
                    result = await publishToHashnode(article, this.config.hashnode, {
                        draft: this.options.draft
                    });
                    break;

                default:
                    throw new Error(`不支持的平台: ${platform}`);
            }

            return {
                ...result,
                platform: platform.toUpperCase()
            };

        } catch (error) {
            return {
                success: false,
                platform: platform.toUpperCase(),
                error: error.message
            };
        }
    }

    /**
     * 发布单篇文章到所有指定平台
     */
    async publishArticle(article) {
        console.log(`\n📄 发布文章: "${article.title}"`);
        console.log('─'.repeat(50));

        const articleResults = [];

        for (const platform of this.options.platforms) {
            console.log(`\n🔄 发布到 ${platform.toUpperCase()}...`);

            const result = await this.publishToPlatform(article, platform);
            articleResults.push(result);

            if (result.success) {
                console.log(`✅ ${result.platform} 发布成功`);
                if (result.url) {
                    console.log(`   📎 链接: ${result.url}`);
                }
                if (result.id) {
                    console.log(`   🆔 ID: ${result.id}`);
                }
            } else {
                console.log(`❌ ${result.platform} 发布失败: ${result.error}`);
            }

            // 添加延迟避免API限制
            if (this.options.platforms.indexOf(platform) < this.options.platforms.length - 1) {
                await this.delay(2000);
            }
        }

        return {
            article: article.title,
            filename: article.filename,
            results: articleResults
        };
    }

    /**
     * 主发布流程
     */
    async publish() {
        console.log('🚀 GitHub Actions 自动发布工具');
        console.log('═'.repeat(50));

        this.showConfiguration();

        const articlesToPublish = this.getArticlesToPublish();
        if (articlesToPublish.length === 0) {
            process.exit(0);
        }

        console.log('🔄 开始发布流程...\n');

        for (const articleFile of articlesToPublish) {
            try {
                const article = this.parseArticle(articleFile);
                const publishResult = await this.publishArticle(article);
                this.results.push(publishResult);

                // 文章间添加延迟
                if (articlesToPublish.indexOf(articleFile) < articlesToPublish.length - 1) {
                    await this.delay(3000);
                }

            } catch (error) {
                console.error(`❌ 处理文章 ${articleFile} 时出错:`, error.message);
                this.results.push({
                    article: articleFile,
                    filename: articleFile,
                    results: [{
                        success: false,
                        platform: 'ALL',
                        error: error.message
                    }]
                });
            }
        }

        this.generateSummary();
    }

    /**
     * 生成发布总结
     */
    generateSummary() {
        console.log('\n📊 发布总结');
        console.log('═'.repeat(50));

        let totalSuccess = 0;
        let totalFailed = 0;

        this.results.forEach(articleResult => {
            console.log(`\n📄 ${articleResult.article}:`);

            articleResult.results.forEach(result => {
                if (result.success) {
                    console.log(`   ✅ ${result.platform}: 成功`);
                    if (result.url) {
                        console.log(`      📎 ${result.url}`);
                    }
                    totalSuccess++;
                } else {
                    console.log(`   ❌ ${result.platform}: ${result.error}`);
                    totalFailed++;
                }
            });
        });

        console.log(`\n📈 总计:`);
        console.log(`   ✅ 成功: ${totalSuccess}`);
        console.log(`   ❌ 失败: ${totalFailed}`);

        // 设置退出码
        if (totalFailed > 0) {
            console.log('\n⚠️ 部分发布任务失败，请检查日志');
            process.exit(1);
        } else {
            console.log('\n🎉 所有发布任务完成！');
            process.exit(0);
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

// 执行发布
if (require.main === module) {
    const publisher = new GitHubActionsPublisher();
    publisher.publish().catch(error => {
        console.error('❌ 发布过程中发生致命错误:', error);
        process.exit(1);
    });
}

module.exports = GitHubActionsPublisher; 