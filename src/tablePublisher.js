const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const chalk = require('chalk');

// 导入工具类
const TableParser = require('./utils/tableParser');
const TableUpdater = require('./utils/tableUpdater');

// 导入发布器
const { publishToDevTo } = require('./publishers/devto');
const { publishToHashnode } = require('./publishers/hashnode');

/**
 * 基于表格的文章发布器
 * 支持从CSV/Excel文件中读取文章信息并批量发布
 */
class TablePublisher {
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

        this.parser = new TableParser();
        this.updater = new TableUpdater();
        this.results = [];
    }

    /**
     * 主发布流程
     * @param {string} tablePath - 表格文件路径
     * @param {object} options - 发布选项
     * @returns {Promise<object>} 发布结果
     */
    async publish(tablePath, options = {}) {
        try {
            console.log(chalk.blue('📊 基于表格的文章发布工具'));
            console.log(chalk.blue('═'.repeat(50)));

            // 1. 验证表格格式
            console.log(chalk.yellow('\n📋 验证表格格式...'));
            const validation = await this.parser.validateFormat(tablePath);

            if (!validation.valid) {
                console.log(chalk.red(`❌ ${validation.message}`));
                if (validation.suggestions) {
                    console.log(chalk.yellow('💡 建议:'));
                    validation.suggestions.forEach(suggestion => {
                        console.log(`   • ${suggestion}`);
                    });
                }
                return { success: false, error: validation.message };
            }

            console.log(chalk.green(`✅ ${validation.message}`));

            // 2. 解析表格数据
            console.log(chalk.yellow('\n📊 解析表格数据...'));
            const articles = await this.parser.parseFile(tablePath);

            if (articles.length === 0) {
                console.log(chalk.yellow('⚠️ 表格中没有找到有效的文章数据'));
                return { success: false, error: '没有找到有效的文章数据' };
            }

            // 3. 筛选未发布的文章
            const unpublishedArticles = options.forceAll ?
                articles : this.parser.getUnpublishedArticles(articles);

            if (unpublishedArticles.length === 0) {
                console.log(chalk.green('🎉 所有文章都已发布到所有平台！'));
                return { success: true, message: '所有文章都已发布', publishedCount: 0 };
            }

            console.log(chalk.cyan(`\n📝 找到 ${unpublishedArticles.length} 篇需要发布的文章:`));
            unpublishedArticles.forEach((article, index) => {
                const devtoStatus = article.platformStatus.devto.published ? '✅' : '❌';
                const hashnodeStatus = article.platformStatus.hashnode.published ? '✅' : '❌';
                console.log(`   ${index + 1}. ${article.title}`);
                console.log(`      DEV.to: ${devtoStatus}  Hashnode: ${hashnodeStatus}`);
            });

            // 4. 显示配置状态
            this.showConfiguration();

            // 5. 确认发布
            if (!options.autoConfirm) {
                console.log(chalk.yellow('\n⚠️ 准备发布文章，请确认:'));
                console.log(`   📄 待发布文章: ${unpublishedArticles.length} 篇`);
                console.log(`   📊 发布模式: ${options.draft ? '草稿' : '正式发布'}`);
                console.log(chalk.yellow('   添加 --yes 参数可跳过确认'));
            }

            // 6. 开始发布
            console.log(chalk.green('\n🚀 开始发布...'));
            const publishResults = await this.publishArticles(unpublishedArticles, options);

            // 7. 更新表格文件
            console.log(chalk.yellow('\n📝 更新表格文件...'));
            const updateResult = await this.updater.batchUpdate(tablePath, publishResults, articles);

            if (updateResult.success) {
                console.log(chalk.green(`✅ ${updateResult.message}`));
            } else {
                console.log(chalk.red(`❌ 表格更新失败: ${updateResult.error}`));
            }

            // 8. 显示结果摘要
            this.showSummary(publishResults);

            return {
                success: true,
                publishResults,
                updateResult,
                publishedCount: publishResults.length
            };

        } catch (error) {
            console.error(chalk.red(`\n💥 发布过程出错: ${error.message}`));
            return { success: false, error: error.message };
        }
    }

    /**
     * 发布多篇文章
     * @param {Array} articles - 文章数组
     * @param {object} options - 发布选项
     * @returns {Promise<Array>} 发布结果数组
     */
    async publishArticles(articles, options = {}) {
        const results = [];

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];

            console.log(chalk.yellow(`\n📝 [${i + 1}/${articles.length}] 处理文章: ${article.title}`));
            console.log('─'.repeat(50));

            try {
                // 准备文章内容
                const preparedArticle = await this.prepareArticle(article);

                // 发布到各平台
                const articleResults = await this.publishToAllPlatforms(preparedArticle, options);

                results.push({
                    article: article.title,
                    filename: article.filePath || `table_row_${i + 1}`,
                    results: articleResults
                });

                // 添加延迟避免API限制
                if (i < articles.length - 1) {
                    await this.delay(2000);
                }

            } catch (error) {
                console.error(chalk.red(`❌ 处理文章失败: ${error.message}`));
                results.push({
                    article: article.title,
                    filename: article.filePath || `table_row_${i + 1}`,
                    results: [{
                        success: false,
                        platform: 'ALL',
                        error: error.message
                    }]
                });
            }
        }

        return results;
    }

    /**
     * 准备文章内容
     * @param {object} article - 文章对象
     * @returns {Promise<object>} 准备好的文章对象
     */
    async prepareArticle(article) {
        // 如果有文件路径，从文件读取内容
        if (article.filePath && !article.content) {
            try {
                const fullPath = path.resolve(article.filePath);
                const fileContent = await fs.readFile(fullPath, 'utf8');

                // 如果是Markdown文件，解析Front Matter
                if (fullPath.endsWith('.md')) {
                    const { data: frontMatter, content } = matter(fileContent);

                    // 合并Front Matter和表格数据，表格数据优先
                    article.content = content;
                    article.title = article.title || frontMatter.title;
                    article.description = article.description || frontMatter.description;
                    article.tags = article.tags.length > 0 ? article.tags : frontMatter.tags || [];
                    article.coverImage = article.coverImage || frontMatter.cover_image;
                    article.canonicalUrl = article.canonicalUrl || frontMatter.canonical_url;
                    article.series = article.series || frontMatter.series;
                } else {
                    article.content = fileContent;
                }

                console.log(chalk.green(`✅ 从文件加载内容: ${path.basename(article.filePath)}`));

            } catch (error) {
                console.warn(chalk.yellow(`⚠️ 无法读取文件 ${article.filePath}: ${error.message}`));
                // 继续使用表格中的内容
            }
        }

        // 验证必需字段
        if (!article.title) {
            throw new Error('文章标题不能为空');
        }

        if (!article.content || article.content.trim().length === 0) {
            throw new Error('文章内容不能为空');
        }

        console.log(chalk.blue(`   📄 标题: ${article.title}`));
        console.log(chalk.blue(`   🏷️ 标签: ${article.tags.join(', ') || '无'}`));
        console.log(chalk.blue(`   📝 内容长度: ${article.content.length} 字符`));

        return article;
    }

    /**
     * 发布到所有平台
     * @param {object} article - 文章对象
     * @param {object} options - 发布选项
     * @returns {Promise<Array>} 发布结果数组
     */
    async publishToAllPlatforms(article, options = {}) {
        const results = [];
        const platforms = ['devto', 'hashnode'];

        for (const platform of platforms) {
            // 检查是否已发布到该平台
            if (article.platformStatus[platform].published && !options.forceRepublish) {
                console.log(chalk.yellow(`⏭ 跳过 ${platform.toUpperCase()}（已发布）`));
                continue;
            }

            if (!this.config[platform].enabled) {
                console.log(chalk.yellow(`⏭ 跳过 ${platform.toUpperCase()}（未配置）`));
                continue;
            }

            console.log(chalk.cyan(`🔄 发布到 ${platform.toUpperCase()}...`));

            try {
                const result = await this.publishToPlatform(article, platform, options);
                results.push(result);

                if (result.success) {
                    console.log(chalk.green(`✅ ${result.platform} 发布成功`));
                    if (result.url) {
                        console.log(chalk.blue(`   🔗 链接: ${result.url}`));
                    }
                } else {
                    console.log(chalk.red(`❌ ${result.platform} 发布失败: ${result.error}`));
                }

            } catch (error) {
                console.log(chalk.red(`❌ ${platform.toUpperCase()} 发布失败: ${error.message}`));
                results.push({
                    success: false,
                    platform: platform.toUpperCase(),
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 发布到指定平台
     * @param {object} article - 文章对象
     * @param {string} platform - 平台名称
     * @param {object} options - 发布选项
     * @returns {Promise<object>} 发布结果
     */
    async publishToPlatform(article, platform, options = {}) {
        const config = this.config[platform];

        switch (platform) {
            case 'devto':
                return await publishToDevTo(article, config, { draft: options.draft });
            case 'hashnode':
                return await publishToHashnode(article, config, { draft: options.draft });
            default:
                throw new Error(`不支持的平台: ${platform}`);
        }
    }

    /**
     * 显示配置状态
     */
    showConfiguration() {
        console.log(chalk.yellow('\n🔧 平台配置状态:'));
        console.log(`   DEV.to: ${this.config.devto.enabled ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置')}`);
        console.log(`   Hashnode: ${this.config.hashnode.enabled ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置')}`);

        // 添加更多调试信息
        console.log(chalk.yellow('\n🔍 环境变量详情:'));
        console.log(`   DEVTO_API_KEY: ${process.env.DEVTO_API_KEY ? '存在' : '不存在'}`);
        console.log(`   HASHNODE_API_KEY: ${process.env.HASHNODE_API_KEY ? '存在' : '不存在'}`);
        console.log(`   HASHNODE_PUBLICATION_ID: ${process.env.HASHNODE_PUBLICATION_ID ? '存在' : '不存在'}`);
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
    }

    /**
     * 显示结果摘要
     * @param {Array} results - 发布结果数组
     */
    showSummary(results) {
        console.log(chalk.green('\n📊 发布结果摘要'));
        console.log('═'.repeat(50));

        const stats = {
            total: results.length,
            success: 0,
            devtoSuccess: 0,
            hashnodeSuccess: 0,
            errors: 0
        };

        const successfulPublishes = [];
        const failedPublishes = [];

        for (const result of results) {
            for (const platformResult of result.results) {
                if (platformResult.success) {
                    stats.success++;
                    const platform = platformResult.platform.toLowerCase();
                    if (platform.includes('dev')) stats.devtoSuccess++;
                    if (platform.includes('hashnode')) stats.hashnodeSuccess++;

                    successfulPublishes.push({
                        article: result.article,
                        platform: platformResult.platform,
                        url: platformResult.url
                    });
                } else {
                    stats.errors++;
                    failedPublishes.push({
                        article: result.article,
                        platform: platformResult.platform,
                        error: platformResult.error
                    });
                }
            }
        }

        // 显示成功发布
        if (successfulPublishes.length > 0) {
            console.log(chalk.green('\n✅ 成功发布:'));
            successfulPublishes.forEach(pub => {
                console.log(`   • ${pub.platform}: ${pub.article}`);
                if (pub.url) console.log(`     🔗 ${pub.url}`);
            });
        }

        // 显示失败发布
        if (failedPublishes.length > 0) {
            console.log(chalk.red('\n❌ 发布失败:'));
            failedPublishes.forEach(pub => {
                console.log(`   • ${pub.platform}: ${pub.article}`);
                console.log(`     💥 ${pub.error}`);
            });
        }

        // 显示统计
        console.log(chalk.cyan('\n📈 统计信息:'));
        console.log(`   📄 处理文章: ${stats.total} 篇`);
        console.log(`   ✅ 成功发布: ${stats.success} 次`);
        console.log(`   🔵 DEV.to: ${stats.devtoSuccess} 次`);
        console.log(`   🟡 Hashnode: ${stats.hashnodeSuccess} 次`);
        console.log(`   ❌ 失败: ${stats.errors} 次`);
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 命令行接口
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(chalk.yellow('用法: node tablePublisher.js <表格文件路径> [选项]'));
        console.log('\n选项:');
        console.log('  --draft              发布为草稿');
        console.log('  --yes                跳过确认提示');
        console.log('  --force-all          发布所有文章（包括已发布的）');
        console.log('  --force-republish    强制重新发布到已发布的平台');
        console.log('\n支持的文件格式: .csv, .xlsx, .xls');
        console.log('\n示例:');
        console.log('  node tablePublisher.js articles.csv --draft --yes');
        console.log('  node tablePublisher.js articles.xlsx --force-all');
        process.exit(1);
    }

    const tablePath = args[0];
    const options = {
        draft: args.includes('--draft'),
        autoConfirm: args.includes('--yes'),
        forceAll: args.includes('--force-all'),
        forceRepublish: args.includes('--force-republish')
    };

    try {
        // 检查文件是否存在
        await fs.access(tablePath);

        const publisher = new TablePublisher();
        const result = await publisher.publish(tablePath, options);

        if (result.success) {
            console.log(chalk.green('\n🎉 表格发布完成！'));
        } else {
            console.log(chalk.red('\n💥 表格发布失败！'));
            process.exit(1);
        }

    } catch (error) {
        console.error(chalk.red(`\n💥 发布失败: ${error.message}`));
        if (error.code === 'ENOENT') {
            console.log(chalk.yellow(`💡 请检查文件路径是否正确: ${tablePath}`));
        }
        process.exit(1);
    }
}

// 如果直接运行此文件，则执行命令行接口
if (require.main === module) {
    main();
}

module.exports = TablePublisher; 