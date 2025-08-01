#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const iconv = require('iconv-lite');

/**
 * 内容库CSV文件提取器
 * 处理编码问题并将数据转换为ready-to-publish.csv格式
 */
class ContentDBExtractor {
    constructor() {
        this.articlesDir = path.join(__dirname, '..', 'articles');
        this.contentDbPattern = /内容库.*\.csv$/i;
        this.readyToPushPath = path.join(this.articlesDir, 'ready-to-publish.csv');
    }

    /**
     * 检测并处理内容库CSV文件
     */
    async processContentDB() {
        try {
            console.log('🔍 检测内容库CSV文件...');

            const files = fs.readdirSync(this.articlesDir);
            const contentDbFiles = files.filter(file => this.contentDbPattern.test(file));

            if (contentDbFiles.length === 0) {
                console.log('ℹ️ 未发现内容库CSV文件');
                return;
            }

            console.log(`📁 发现${contentDbFiles.length}个内容库文件:`, contentDbFiles);

            for (const file of contentDbFiles) {
                await this.extractFromFile(file);
                await this.deleteProcessedFile(file);
            }

            console.log('✅ 内容库文件处理完成!');
        } catch (error) {
            console.error('❌ 处理失败:', error.message);
            process.exit(1);
        }
    }

    /**
     * 从单个内容库文件提取数据
     */
    async extractFromFile(filename) {
        const filePath = path.join(this.articlesDir, filename);
        console.log(`📊 处理文件: ${filename}`);

        try {
            // 尝试多种编码方式读取文件
            const data = await this.readFileWithCorrectEncoding(filePath);
            const articles = await this.parseCSVData(data);
            const validArticles = this.filterValidArticles(articles);

            if (validArticles.length > 0) {
                await this.appendToReadyToPush(validArticles);
                console.log(`✅ 成功提取 ${validArticles.length} 篇文章`);
            } else {
                console.log('⚠️ 未找到有效的文章数据');
            }
        } catch (error) {
            console.error(`❌ 处理文件 ${filename} 失败:`, error.message);
        }
    }

    /**
     * 尝试不同编码读取文件
     */
    async readFileWithCorrectEncoding(filePath) {
        const encodings = ['utf8', 'gb2312', 'gbk', 'big5', 'utf16le']; // 优先使用utf8

        for (const encoding of encodings) {
            try {
                const buffer = fs.readFileSync(filePath);
                const decoded = iconv.decode(buffer, encoding);

                // 检查是否包含可读的CSV结构 - 更灵活的检测
                const hasCSVStructure = (
                    // 检查是否包含CSV常见的字段（中英文）
                    (decoded.includes('title') || decoded.includes('标题') || decoded.includes('文章标题')) ||
                    // 检查是否包含内容相关字段
                    (decoded.includes('content') || decoded.includes('内容') || decoded.includes('发布内容')) ||
                    // 检查是否包含文件路径
                    (decoded.includes('file_path') || decoded.includes('文件路径') || decoded.includes('.md')) ||
                    // 检查是否包含发布状态
                    (decoded.includes('published') || decoded.includes('发布'))
                );

                // 同时检查是否不包含太多乱码字符
                const totalChars = decoded.length;
                const invalidChars = (decoded.match(/[^\x20-\x7E\u4e00-\u9fff\s\n\r,;"']/g) || []).length;
                const invalidRatio = invalidChars / totalChars;

                console.log(`🔍 测试编码 ${encoding}: CSV结构=${hasCSVStructure}, 乱码率=${(invalidRatio * 100).toFixed(1)}%`);

                if (hasCSVStructure && invalidRatio < 0.15) { // 降低乱码容忍度到15%，优先选择最干净的编码
                    console.log(`📝 使用 ${encoding} 编码成功读取文件 (乱码率: ${(invalidRatio * 100).toFixed(1)}%)`);
                    return decoded;
                }
            } catch (error) {
                console.log(`❌ 编码 ${encoding} 解析失败:`, error.message);
                continue;
            }
        }

        console.warn('⚠️ 所有编码尝试失败，使用UTF-8作为fallback');
        // 如果所有编码都失败，使用UTF-8作为fallback
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * 解析CSV数据 - 支持包含完整内容的格式
     */
    async parseCSVData(data) {
        return new Promise((resolve, reject) => {
            const articles = [];

            // 使用csv-parser处理复杂的CSV格式（包含换行符的内容）
            const { Readable } = require('stream');
            const csvStream = Readable.from([data]);
            const results = [];

            csvStream
                .pipe(csv({
                    mapHeaders: ({ header }) => {
                        // 映射中文表头到英文字段名
                        const headerMap = {
                            'title': 'title',
                            '标题': 'title',
                            '发布': 'status',
                            '提出人': 'author',
                            '发布内容': 'content',
                            '发布内容（文本）': 'content_text',
                            '关键词': 'keywords',
                            '标签': 'tags',
                            '图片': 'image',
                            '渠道&账号': 'channels',
                            '发布完成': 'published'
                        };
                        return headerMap[header] || header;
                    }
                }))
                .on('data', (row) => {
                    results.push(row);
                })
                .on('end', () => {
                    // 处理解析后的数据 - 支持两种文章模式
                    results.forEach((row, index) => {
                        try {
                            const title = this.cleanText(row.title);
                            const filePath = this.cleanText(row.content || ''); // "发布内容"列作为文件路径
                            const directContent = this.cleanText(row.content_text || ''); // "发布内容（文本）"列作为直接内容
                            const author = this.cleanText(row.author || '');
                            const tags = this.cleanText(row.tags || row.keywords || '');
                            const channels = this.cleanText(row.channels || ''); // "渠道&账号"列，标志发布页面
                            const image = this.cleanText(row.image || ''); // "图片"列
                            const publishedStatus = this.cleanText(row.published || ''); // "发布完成"列

                            let finalContent = '';
                            let contentSource = '';
                            let isFromFile = false;

                            // 模式1: 文件路径模式 - "发布内容"列不为空时
                            if (filePath && filePath.length > 0) {
                                console.log(`📄 文件路径模式 - 文章: ${title}`);
                                console.log(`   📂 文件路径: ${filePath}`);

                                // 确保文件路径以.md结尾
                                const mdFilePath = filePath.endsWith('.md') ? filePath : filePath + '.md';
                                const fullPath = path.join(this.articlesDir, mdFilePath);

                                if (fs.existsSync(fullPath)) {
                                    try {
                                        finalContent = fs.readFileSync(fullPath, 'utf8');
                                        contentSource = `来自文件: ${mdFilePath}`;
                                        isFromFile = true;
                                        console.log(`   ✅ 成功读取文件 (${finalContent.length} 字符)`);
                                    } catch (error) {
                                        console.warn(`   ⚠️ 读取文件失败: ${error.message}`);
                                        finalContent = '';
                                    }
                                } else {
                                    console.warn(`   ⚠️ 文件不存在: ${fullPath}`);
                                    finalContent = '';
                                }
                            }

                            // 模式2: 直接内容模式 - "发布内容"为空，使用"发布内容（文本）"
                            if (!finalContent && directContent && directContent.length > 100) {
                                console.log(`📝 直接内容模式 - 文章: ${title}`);
                                finalContent = directContent;
                                contentSource = '来自CSV直接内容';
                                isFromFile = false;
                                console.log(`   ✅ 使用直接内容 (${finalContent.length} 字符)`);
                            }

                            // 验证最终内容
                            if (title && finalContent && finalContent.length > 100) {
                                const article = {
                                    title: title,
                                    content: finalContent,
                                    author: author,
                                    tags: tags.split(/[,，;；\s]+/).filter(t => t.trim()),
                                    description: finalContent.substring(0, 200) + '...', // 从内容生成描述
                                    status: this.cleanText(row.status || ''),
                                    channels: channels, // 渠道&账号 - 标志发布页面
                                    image: image, // 图片
                                    publishedStatus: publishedStatus, // 发布完成状态
                                    devto_published: false,
                                    hashnode_published: false,
                                    contentSource: contentSource, // 记录内容来源
                                    isFromFile: isFromFile
                                };

                                // 根据渠道信息设置发布平台
                                this.setPublishingPlatforms(article);

                                // 如果是文件模式，添加file_path字段
                                if (isFromFile) {
                                    article.file_path = filePath.endsWith('.md') ? filePath : filePath + '.md';
                                }

                                articles.push(article);
                                console.log(`   ✅ 文章添加成功: ${title} (${contentSource})`);
                                if (channels) {
                                    console.log(`   📺 发布渠道: ${channels}`);
                                }
                            } else {
                                console.warn(`   ❌ 跳过文章: ${title} - 标题或内容无效`);
                            }
                        } catch (error) {
                            console.warn(`⚠️ 跳过第${index + 1}行: ${error.message}`);
                        }
                    });

                    resolve(articles);
                })
                .on('error', (error) => {
                    console.warn('⚠️ CSV解析错误，回退到简单解析:', error.message);
                    // 回退到简单的行解析
                    this.parseCSVDataSimple(data).then(resolve).catch(reject);
                });
        });
    }

    /**
     * 简单的CSV解析（回退方案）
     */
    async parseCSVDataSimple(data) {
        const articles = [];
        const lines = data.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return articles;
        }

        // 解析表头
        const headerLine = lines[0];
        console.log('📋 CSV表头:', headerLine);

        // 尝试解析第一行数据作为示例
        if (lines.length > 1) {
            const firstDataLine = lines[1];
            console.log('📝 第一行数据示例:', firstDataLine.substring(0, 200) + '...');

            try {
                const row = this.parseCSVLine(firstDataLine);
                console.log(`📊 解析到 ${row.length} 个字段`);

                if (row.length >= 4) {
                    const title = this.cleanText(row[0]);
                    const content = this.cleanText(row[3] || row[4] || ''); // 尝试第3或第4列作为内容

                    if (title && content && content.length > 50) {
                        articles.push({
                            title: title,
                            content: content,
                            author: this.cleanText(row[2] || ''),
                            tags: [],
                            description: content.substring(0, 200) + '...',
                            devto_published: false,
                            hashnode_published: false
                        });
                        console.log(`✅ 成功解析文章: ${title}`);
                    }
                }
            } catch (error) {
                console.warn('⚠️ 简单解析也失败:', error.message);
            }
        }

        return articles;
    }

    /**
     * 解析CSV行（处理引号包围的字段）
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                } else {
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        result.push(current);
        return result;
    }

    /**
     * 清理文本（去除引号和乱码）
     */
    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/^["']|["']$/g, '') // 去除首尾引号
            .replace(/[^\x20-\x7E\u4e00-\u9fff]/g, '') // 去除乱码字符，保留ASCII和中文
            .trim();
    }

    /**
     * 根据渠道信息设置发布平台
     */
    setPublishingPlatforms(article) {
        if (!article.channels) return;

        const channels = article.channels.toLowerCase();

        // 根据渠道关键词设置发布平台
        if (channels.includes('dev.to') || channels.includes('devto') || channels.includes('dev')) {
            article.devto_published = false; // 标记为待发布
            console.log(`   🎯 设置DEV.to发布: ${article.title}`);
        }

        if (channels.includes('hashnode') || channels.includes('hash')) {
            article.hashnode_published = false; // 标记为待发布
            console.log(`   🎯 设置Hashnode发布: ${article.title}`);
        }

        // 可以添加更多平台识别
        if (channels.includes('medium')) {
            console.log(`   💡 检测到Medium渠道 (暂不支持): ${article.title}`);
        }

        if (channels.includes('掘金') || channels.includes('juejin')) {
            console.log(`   💡 检测到掘金渠道 (暂不支持): ${article.title}`);
        }

        // 默认情况：如果没有特定渠道，发布到所有配置的平台
        if (!channels.includes('dev') && !channels.includes('hash') &&
            !channels.includes('medium') && !channels.includes('掘金')) {
            console.log(`   🌐 通用渠道，发布到所有平台: ${article.title}`);
        }
    }

    /**
     * 过滤出有效的文章
     */
    filterValidArticles(articles) {
        console.log(`🔍 过滤 ${articles.length} 篇文章...`);

        const validArticles = articles.filter((article, index) => {
            console.log(`📝 检查第${index + 1}篇: ${article.title}`);

            // 必须有标题
            if (!article.title || article.title.length < 3) {
                console.log(`   ❌ 标题无效: ${article.title}`);
                return false;
            }

            // 必须有内容
            if (!article.content || article.content.length < 50) {
                console.log(`   ❌ 内容太短: ${article.content?.length || 0} 字符`);
                return false;
            }

            // 检查内容是否是有效的文章
            const hasMarkdownStructure = article.content.includes('#') ||
                article.content.includes('##') ||
                article.content.length > 200; // 降低阈值从500到200

            if (!hasMarkdownStructure) {
                console.log(`   ❌ 内容结构不像完整文章 (无标题标记且长度<200)`);
                return false;
            }

            console.log(`   ✅ 有效文章 (${article.content.length} 字符, ${article.contentSource})`);
            return true;
        });

        console.log(`📊 过滤结果: ${validArticles.length}/${articles.length} 篇有效`);
        return validArticles;
    }

    /**
     * 转换为ready-to-publish.csv格式
     */
    convertToReadyFormat(articles) {
        return articles.map(article => {
            const baseArticle = {
                title: article.title,
                description: article.description || `Article about ${article.title}`,
                tags: this.normalizeTags(article.tags),
                channels: article.channels || '', // 渠道&账号信息
                image: article.image || '', // 图片信息
                devto_published: article.devto_published || false,
                hashnode_published: article.hashnode_published || false,
                author: article.author || 'Context Space Team',
                status: article.status || '',
                published_status: article.publishedStatus || ''
            };

            // 根据内容来源决定输出格式
            if (article.isFromFile && article.file_path) {
                // 文件路径模式：使用 file_path 字段
                baseArticle.file_path = article.file_path;
                console.log(`📄 输出文件路径模式: ${article.title} -> ${article.file_path}`);
                if (article.channels) {
                    console.log(`   📺 渠道: ${article.channels}`);
                }
            } else {
                // 直接内容模式：使用 content 字段
                baseArticle.content = article.content;
                console.log(`📝 输出直接内容模式: ${article.title} (${article.content.length} 字符)`);
                if (article.channels) {
                    console.log(`   📺 渠道: ${article.channels}`);
                }
            }

            return baseArticle;
        });
    }

    /**
     * 标准化标签格式
     */
    normalizeTags(tags) {
        if (!tags) return 'ai,context,engineering';

        // 如果是数组，转换为字符串
        if (Array.isArray(tags)) {
            tags = tags.join(',');
        }

        // 确保是字符串
        if (typeof tags !== 'string') {
            tags = String(tags);
        }

        // 将中文标签映射为英文
        const tagMap = {
            'AI工具': 'ai,tools',
            'AI Trend': 'ai,trends',
            'AI Tech': 'ai,technology',
            'Context Engineering': 'context,engineering',
            'Developer Tools': 'development,tools',
            'Engineering': 'engineering'
        };

        return tagMap[tags] || tags.toLowerCase().replace(/[^a-z0-9,]/g, '').replace(/,+/g, ',');
    }

    /**
     * 追加到ready-to-publish.csv
     */
    async appendToReadyToPush(articles) {
        const readyFormatArticles = this.convertToReadyFormat(articles);

        // 检查是否已存在ready-to-publish.csv
        let existingArticles = [];
        if (fs.existsSync(this.readyToPushPath)) {
            try {
                const existingData = fs.readFileSync(this.readyToPushPath, 'utf8');
                const lines = existingData.split('\n').filter(line => line.trim());

                // 解析现有数据
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        const row = this.parseCSVLine(line);
                        if (row.length >= 4) {
                            existingArticles.push({
                                title: this.cleanText(row[0]),
                                file_path: this.cleanText(row[3])
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ 读取现有ready-to-publish.csv失败，将创建新文件');
            }
        }

        // 过滤重复文章
        const newArticles = readyFormatArticles.filter(article => {
            return !existingArticles.some(existing =>
                existing.title === article.title || existing.file_path === article.file_path
            );
        });

        if (newArticles.length === 0) {
            console.log('ℹ️ 没有新文章需要添加');
            return;
        }

        // 写入CSV - 支持两种内容模式及渠道信息
        const csvWriter = createObjectCsvWriter({
            path: this.readyToPushPath,
            header: [
                { id: 'title', title: 'title' },
                { id: 'description', title: 'description' },
                { id: 'tags', title: 'tags' },
                { id: 'content', title: 'content' },          // 直接内容模式
                { id: 'file_path', title: 'file_path' },      // 文件路径模式
                { id: 'channels', title: 'channels' },        // 渠道&账号 - 发布页面标志
                { id: 'image', title: 'image' },              // 图片
                { id: 'devto_published', title: 'devto_published' },
                { id: 'hashnode_published', title: 'hashnode_published' },
                { id: 'author', title: 'author' },
                { id: 'status', title: 'status' },            // 发布状态
                { id: 'published_status', title: 'published_status' } // 发布完成状态
            ],
            append: fs.existsSync(this.readyToPushPath)
        });

        await csvWriter.writeRecords(newArticles);
        console.log(`📝 已添加 ${newArticles.length} 篇新文章到发布队列`);
    }

    /**
     * 删除已处理的文件
     */
    async deleteProcessedFile(filename) {
        const filePath = path.join(this.articlesDir, filename);

        try {
            // 创建备份
            const backupDir = path.join(this.articlesDir, 'processed-backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${timestamp}-${filename}`);

            fs.copyFileSync(filePath, backupPath);
            fs.unlinkSync(filePath);

            console.log(`🗑️ 已删除处理完成的文件: ${filename}`);
            console.log(`💾 备份保存至: processed-backups/${timestamp}-${filename}`);
        } catch (error) {
            console.error(`❌ 删除文件失败: ${error.message}`);
        }
    }
}

// 主执行逻辑
async function main() {
    console.log('🚀 启动内容库CSV文件提取器...');

    const extractor = new ContentDBExtractor();
    await extractor.processContentDB();
}

// 如果是直接运行脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContentDBExtractor; 