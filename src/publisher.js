#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');
const ora = require('ora');

// 导入各平台发布器
const { publishToDevTo } = require('./publishers/devto');
const { publishToHashnode } = require('./publishers/hashnode');
const { publishToHackerNews } = require('./publishers/hackernews');

/**
 * 多平台文章发布器
 */
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
            hackernews: {
                username: process.env.HN_USERNAME,
                password: process.env.HN_PASSWORD,
                enabled: !!process.env.HN_USERNAME && !!process.env.HN_PASSWORD
            }
        };
    }

    /**
     * 解析文章文件
     * @param {string} filePath - 文章文件路径
     * @returns {object} 解析后的文章数据
     */
    parseArticle(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data: frontMatter, content } = matter(fileContent);

            return {
                title: frontMatter.title,
                description: frontMatter.description || '',
                tags: frontMatter.tags || [],
                published: frontMatter.published !== false, // 默认为true
                coverImage: frontMatter.cover_image || frontMatter.coverImage,
                canonicalUrl: frontMatter.canonical_url || frontMatter.canonicalUrl,
                content: content,
                frontMatter: frontMatter
            };
        } catch (error) {
            throw new Error(`解析文章失败: ${error.message}`);
        }
    }

    /**
     * 发布到所有平台
     * @param {string} filePath - 文章文件路径
     * @param {object} options - 发布选项
     */
    async publishToAll(filePath, options = {}) {
        const spinner = ora('开始解析文章...').start();

        try {
            // 解析文章
            const article = this.parseArticle(filePath);
            spinner.succeed(`文章解析成功: ${chalk.green(article.title)}`);

            const results = [];
            const errors = [];

            // 发布到各个平台
            const platforms = [
                { name: 'DEV.to', config: this.config.devto, publisher: publishToDevTo },
                { name: 'Hashnode', config: this.config.hashnode, publisher: publishToHashnode },
                { name: 'Hacker News', config: this.config.hackernews, publisher: publishToHackerNews }
            ];

            for (const platform of platforms) {
                if (!platform.config.enabled) {
                    console.log(chalk.yellow(`⏭ 跳过 ${platform.name}（未配置API密钥）`));
                    continue;
                }

                const platformSpinner = ora(`正在发布到 ${platform.name}...`).start();

                try {
                    const result = await platform.publisher(article, platform.config, options);
                    platformSpinner.succeed(`✅ ${platform.name} 发布成功: ${result.url || result.id}`);
                    results.push({
                        platform: platform.name,
                        success: true,
                        url: result.url || result.id,
                        data: result
                    });
                } catch (error) {
                    platformSpinner.fail(`❌ ${platform.name} 发布失败: ${error.message}`);
                    errors.push({
                        platform: platform.name,
                        error: error.message
                    });
                }
            }

            // 输出发布结果摘要
            this.printSummary(results, errors);

            return { results, errors };

        } catch (error) {
            spinner.fail(`发布失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 打印发布结果摘要
     */
    printSummary(results, errors) {
        console.log('\n' + chalk.bold('📊 发布结果摘要:'));
        console.log('═'.repeat(50));

        if (results.length > 0) {
            console.log(chalk.green('✅ 成功发布:'));
            results.forEach(result => {
                console.log(`   • ${result.platform}: ${result.url}`);
            });
        }

        if (errors.length > 0) {
            console.log(chalk.red('\n❌ 发布失败:'));
            errors.forEach(error => {
                console.log(`   • ${error.platform}: ${error.error}`);
            });
        }

        console.log(`\n总计: ${chalk.green(results.length)} 成功, ${chalk.red(errors.length)} 失败`);
    }

    /**
     * 批量发布多个文章
     */
    async publishBatch(articlePaths, options = {}) {
        const results = [];

        for (const filePath of articlePaths) {
            console.log(chalk.blue(`\n📝 处理文章: ${path.basename(filePath)}`));
            try {
                const result = await this.publishToAll(filePath, options);
                results.push({ file: filePath, ...result });

                // 添加延迟避免API限制
                if (options.delay) {
                    await new Promise(resolve => setTimeout(resolve, options.delay));
                }
            } catch (error) {
                console.error(chalk.red(`文章 ${filePath} 处理失败: ${error.message}`));
                results.push({ file: filePath, error: error.message });
            }
        }

        return results;
    }
}

// 命令行接口
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(chalk.yellow('用法: node publisher.js <文章路径> [选项]'));
        console.log('选项:');
        console.log('  --delay <ms>  批量发布时的延迟时间（毫秒）');
        console.log('  --draft       发布为草稿');
        process.exit(1);
    }

    const filePath = args[0];
    const options = {};

    // 解析命令行选项
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--delay' && args[i + 1]) {
            options.delay = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--draft') {
            options.draft = true;
        }
    }

    try {
        const publisher = new MultiPlatformPublisher();

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        // 判断是文件还是目录
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // 批量处理目录中的所有markdown文件
            const markdownFiles = fs.readdirSync(filePath)
                .filter(file => file.endsWith('.md'))
                .map(file => path.join(filePath, file));

            if (markdownFiles.length === 0) {
                throw new Error('目录中没有找到markdown文件');
            }

            console.log(chalk.blue(`找到 ${markdownFiles.length} 个markdown文件`));
            await publisher.publishBatch(markdownFiles, options);
        } else {
            // 单个文件处理
            await publisher.publishToAll(filePath, options);
        }

        console.log(chalk.green('\n🎉 所有发布任务已完成！'));

    } catch (error) {
        console.error(chalk.red(`\n💥 发布失败: ${error.message}`));
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { MultiPlatformPublisher }; 