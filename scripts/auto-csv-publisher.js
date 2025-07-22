#!/usr/bin/env node

/**
 * 自动CSV内容发布脚本
 * 
 * 功能：
 * - 自动遍历articles文件夹下的所有CSV文件
 * - 选择未发布的内容中的一篇进行发布
 * - 发布后直接删除已发布的内容
 * - 支持多平台发布（devto, hashnode）
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const TableParser = require('../src/utils/tableParser');
const TableUpdater = require('../src/utils/tableUpdater');
const { publishToDevTo } = require('../src/publishers/devto');
const { publishToHashnode } = require('../src/publishers/hashnode');
const { publishToMedium } = require('../src/publishers/medium');

class AutoCSVPublisher {
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
                cookies: process.env.MEDIUM_COOKIES,
                enabled: !!process.env.MEDIUM_COOKIES
            }
        };

        this.articlesDir = path.join(__dirname, '../articles');
        this.tableParser = new TableParser();
        this.tableUpdater = new TableUpdater();
        this.publishResults = [];
    }

    /**
     * 显示配置状态
     */
    showConfiguration() {
        console.log(chalk.blue('🤖 自动CSV内容发布工具'));
        console.log(chalk.blue('═'.repeat(50)));
        console.log();

        console.log(chalk.yellow('🔧 平台配置状态:'));
        console.log(`   DEV.to: ${this.config.devto.enabled ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置')}`);
        console.log(`   Hashnode: ${this.config.hashnode.enabled ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置')}`);
        console.log(`   Medium: ${this.config.medium.enabled ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置')}`);
        console.log();

        if (!this.config.devto.enabled && !this.config.hashnode.enabled && !this.config.medium.enabled) {
            console.log(chalk.red('❌ 错误: 没有配置任何发布平台'));
            console.log(chalk.yellow('💡 请在.env文件中配置至少一个平台的认证信息'));
            console.log(chalk.yellow('   - DEV.to: DEVTO_API_KEY'));
            console.log(chalk.yellow('   - Hashnode: HASHNODE_API_KEY + HASHNODE_PUBLICATION_ID'));
            console.log(chalk.yellow('   - Medium: MEDIUM_COOKIES (使用 npm run extract-medium-cookies 获取)'));
            process.exit(1);
        }
    }

    /**
     * 获取articles目录下的所有CSV文件
     */
    getCSVFiles() {
        try {
            if (!fs.existsSync(this.articlesDir)) {
                console.log(chalk.red('❌ articles目录不存在'));
                return [];
            }

            const files = fs.readdirSync(this.articlesDir)
                .filter(file => file.endsWith('.csv'))
                .map(file => path.join(this.articlesDir, file));

            console.log(chalk.yellow(`📂 扫描articles目录: ${files.length} 个CSV文件`));
            files.forEach(file => {
                console.log(`   📄 ${path.basename(file)}`);
            });

            return files;
        } catch (error) {
            console.error(chalk.red('❌ 获取CSV文件列表失败:'), error.message);
            return [];
        }
    }

    /**
     * 从所有CSV文件中查找未发布的内容
     */
    async findUnpublishedContent() {
        const csvFiles = this.getCSVFiles();
        if (csvFiles.length === 0) {
            console.log(chalk.yellow('⚠️ 未找到任何CSV文件'));
            return null;
        }

        console.log(chalk.yellow('\n🔍 查找未发布内容...'));

        for (const csvFile of csvFiles) {
            try {
                console.log(`📋 解析文件: ${path.basename(csvFile)}`);

                const articles = await this.tableParser.parseTableFile(csvFile);
                if (!articles || articles.length === 0) {
                    console.log(`   ⚠️ 文件为空或解析失败`);
                    continue;
                }

                // 查找未发布的文章
                const unpublishedArticles = articles.filter(article => {
                    const devtoNotPublished = !article.devto_published ||
                        article.devto_published === false ||
                        article.devto_published === 'false' ||
                        article.devto_published === '否';

                    const hashnodeNotPublished = !article.hashnode_published ||
                        article.hashnode_published === false ||
                        article.hashnode_published === 'false' ||
                        article.hashnode_published === '否';

                    return devtoNotPublished || hashnodeNotPublished;
                });

                if (unpublishedArticles.length > 0) {
                    const selectedArticle = unpublishedArticles[0]; // 选择第一篇未发布的内容
                    console.log(chalk.green(`✅ 找到未发布内容: "${selectedArticle.title}"`));

                    return {
                        article: selectedArticle,
                        filePath: csvFile,
                        allArticles: articles,
                        articleIndex: articles.findIndex(a => a.title === selectedArticle.title)
                    };
                }

                console.log(`   ℹ️ 该文件中所有内容都已发布`);
            } catch (error) {
                console.error(`   ❌ 解析文件失败: ${error.message}`);
                continue;
            }
        }

        console.log(chalk.yellow('ℹ️ 所有CSV文件中的内容都已发布'));
        return null;
    }

    /**
     * 发布文章到指定平台
     */
    async publishToPlatform(article, platform) {
        try {
            if (!this.config[platform].enabled) {
                return {
                    success: false,
                    platform: platform.toUpperCase(),
                    error: `${platform.toUpperCase()} 未配置或配置不完整`,
                    skipped: true
                };
            }

            console.log(`🚀 发布到 ${platform.toUpperCase()}...`);

            let result;
            switch (platform) {
                case 'devto':
                    // 检查是否已在DEV.to发布
                    if (article.devto_published &&
                        article.devto_published !== false &&
                        article.devto_published !== 'false' &&
                        article.devto_published !== '否') {
                        return {
                            success: false,
                            platform: 'DEV.TO',
                            error: '该内容已在DEV.to发布',
                            skipped: true
                        };
                    }
                    result = await publishToDevTo(article, this.config.devto, { draft: false });
                    break;

                case 'hashnode':
                    // 检查是否已在Hashnode发布
                    if (article.hashnode_published &&
                        article.hashnode_published !== false &&
                        article.hashnode_published !== 'false' &&
                        article.hashnode_published !== '否') {
                        return {
                            success: false,
                            platform: 'HASHNODE',
                            error: '该内容已在Hashnode发布',
                            skipped: true
                        };
                    }
                    result = await publishToHashnode(article, this.config.hashnode, { draft: false });
                    break;

                case 'medium':
                    // 检查是否已在Medium发布
                    if (article.medium_published &&
                        article.medium_published !== false &&
                        article.medium_published !== 'false' &&
                        article.medium_published !== '否') {
                        return {
                            success: false,
                            platform: 'MEDIUM',
                            error: '该内容已在Medium发布',
                            skipped: true
                        };
                    }
                    result = await publishToMedium(article, this.config.medium);
                    break;

                default:
                    throw new Error(`不支持的平台: ${platform}`);
            }

            if (result.success) {
                console.log(chalk.green(`✅ ${platform.toUpperCase()} 发布成功`));
                if (result.url) {
                    console.log(`   📎 链接: ${result.url}`);
                }
            } else {
                console.log(chalk.red(`❌ ${platform.toUpperCase()} 发布失败: ${result.error}`));
            }

            return {
                ...result,
                platform: platform.toUpperCase()
            };

        } catch (error) {
            console.error(chalk.red(`❌ ${platform.toUpperCase()} 发布异常:`), error.message);
            return {
                success: false,
                platform: platform.toUpperCase(),
                error: error.message
            };
        }
    }

    /**
     * 发布文章到所有可用平台
     */
    async publishArticle(contentInfo) {
        const { article, filePath, allArticles, articleIndex } = contentInfo;

        console.log(chalk.blue(`\n📄 准备发布: "${article.title}"`));
        console.log(chalk.gray(`📁 文件: ${path.basename(filePath)}`));
        console.log('─'.repeat(50));

        const platforms = ['devto', 'hashnode', 'medium'];
        const results = [];
        let publishedToAnyPlatform = false;

        for (const platform of platforms) {
            const result = await this.publishToPlatform(article, platform);
            results.push(result);

            if (result.success) {
                publishedToAnyPlatform = true;
                // 更新文章的发布状态
                if (platform === 'devto') {
                    article.devto_published = result.url || '是';
                } else if (platform === 'hashnode') {
                    article.hashnode_published = result.url || '是';
                } else if (platform === 'medium') {
                    article.medium_published = result.url || '是';
                }
            }

            // 平台间延迟
            if (platforms.indexOf(platform) < platforms.length - 1) {
                await this.delay(2000);
            }
        }

        return {
            article: article.title,
            filePath,
            results,
            publishedToAnyPlatform,
            contentInfo
        };
    }

    /**
     * 删除已发布的内容（从CSV文件中移除该行）
     */
    async removePublishedContent(contentInfo, publishResult) {
        const { filePath, allArticles, articleIndex } = contentInfo;

        if (!publishResult.publishedToAnyPlatform) {
            console.log(chalk.yellow('⚠️ 内容未成功发布到任何平台，不删除记录'));
            return false;
        }

        try {
            console.log(chalk.yellow('\n🗑️ 删除已发布的内容记录...'));

            // 从数组中移除已发布的文章
            const updatedArticles = [...allArticles];
            updatedArticles.splice(articleIndex, 1);

            // 更新CSV文件
            await this.tableUpdater.updateTableFile(filePath, updatedArticles);

            console.log(chalk.green(`✅ 已从 ${path.basename(filePath)} 中删除已发布内容`));
            console.log(chalk.gray(`   原记录数: ${allArticles.length}`));
            console.log(chalk.gray(`   剩余记录数: ${updatedArticles.length}`));

            return true;
        } catch (error) {
            console.error(chalk.red('❌ 删除内容记录失败:'), error.message);
            return false;
        }
    }

    /**
     * 延迟函数
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 生成发布报告
     */
    generateReport(publishResult) {
        console.log(chalk.blue('\n📊 发布报告'));
        console.log(chalk.blue('═'.repeat(50)));

        if (!publishResult) {
            console.log(chalk.yellow('ℹ️ 未找到待发布内容'));
            return;
        }

        const { article, results, publishedToAnyPlatform } = publishResult;

        console.log(chalk.cyan(`📄 文章: "${article}"`));

        let successCount = 0;
        let failedCount = 0;

        results.forEach(result => {
            if (result.success) {
                console.log(chalk.green(`   ✅ ${result.platform}: 发布成功`));
                if (result.url) {
                    console.log(chalk.gray(`      📎 ${result.url}`));
                }
                successCount++;
            } else if (result.skipped) {
                console.log(chalk.yellow(`   ⏩ ${result.platform}: ${result.error}`));
            } else {
                console.log(chalk.red(`   ❌ ${result.platform}: ${result.error}`));
                failedCount++;
            }
        });

        console.log(chalk.cyan(`\n📈 总计:`));
        console.log(`   ✅ 成功: ${successCount}`);
        console.log(`   ❌ 失败: ${failedCount}`);
        console.log(`   🗑️ 内容删除: ${publishedToAnyPlatform ? '是' : '否'}`);

        if (publishedToAnyPlatform) {
            console.log(chalk.green('\n🎉 发布任务完成！内容已删除'));
        } else {
            console.log(chalk.yellow('\n⚠️ 发布失败，内容记录保留'));
        }
    }

    /**
     * 主发布流程
     */
    async run() {
        this.showConfiguration();

        // 查找未发布内容
        const contentInfo = await this.findUnpublishedContent();
        if (!contentInfo) {
            console.log(chalk.green('\n🎉 所有内容都已发布完成！'));
            process.exit(0);
        }

        // 发布内容
        const publishResult = await this.publishArticle(contentInfo);

        // 删除已发布内容
        if (publishResult.publishedToAnyPlatform) {
            await this.removePublishedContent(contentInfo, publishResult);
        }

        // 生成报告
        this.generateReport(publishResult);

        // 设置退出码
        if (publishResult.publishedToAnyPlatform) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    }
}

// 执行发布
if (require.main === module) {
    const publisher = new AutoCSVPublisher();
    publisher.run().catch(error => {
        console.error(chalk.red('❌ 发布过程中发生致命错误:'), error);
        process.exit(1);
    });
}

module.exports = AutoCSVPublisher; 