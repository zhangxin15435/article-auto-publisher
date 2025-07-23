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
        const encodings = ['utf8', 'gbk', 'gb2312', 'big5', 'utf16le'];

        for (const encoding of encodings) {
            try {
                const buffer = fs.readFileSync(filePath);
                const decoded = iconv.decode(buffer, encoding);

                // 检查是否包含可读的CSV结构
                if (decoded.includes('title') && decoded.includes('.md')) {
                    console.log(`📝 使用 ${encoding} 编码成功读取文件`);
                    return decoded;
                }
            } catch (error) {
                continue;
            }
        }

        // 如果所有编码都失败，使用UTF-8作为fallback
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * 解析CSV数据
     */
    async parseCSVData(data) {
        return new Promise((resolve, reject) => {
            const articles = [];
            const lines = data.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                resolve([]);
                return;
            }

            // 跳过表头，处理数据行
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                try {
                    const row = this.parseCSVLine(line);
                    if (row && row.length >= 4) {
                        articles.push({
                            title: this.cleanText(row[0]),
                            status: this.cleanText(row[1]),
                            description: this.cleanText(row[2] || ''),
                            file_path: this.cleanText(row[3]),
                            tags: this.cleanText(row[4] || ''),
                            image: this.cleanText(row[5] || ''),
                            platform: this.cleanText(row[6] || ''),
                            published_status: this.cleanText(row[7] || '')
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ 跳过无效行: ${line.substring(0, 50)}...`);
                }
            }

            resolve(articles);
        });
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
     * 过滤出有效的文章
     */
    filterValidArticles(articles) {
        return articles.filter(article => {
            // 必须有标题和文件路径
            if (!article.title || !article.file_path) return false;

            // 必须是.md文件
            if (!article.file_path.endsWith('.md')) return false;

            // 检查文件是否存在
            const mdFilePath = path.join(this.articlesDir, article.file_path);
            if (!fs.existsSync(mdFilePath)) {
                console.warn(`⚠️ Markdown文件不存在: ${article.file_path}`);
                return false;
            }

            return true;
        });
    }

    /**
     * 转换为ready-to-publish.csv格式
     */
    convertToReadyFormat(articles) {
        return articles.map(article => ({
            title: article.title,
            description: article.description || `Article about ${article.title}`,
            tags: this.normalizeTags(article.tags),
            file_path: article.file_path,
            devto_published: false,
            hashnode_published: false,
            author: 'Context Space Team'
        }));
    }

    /**
     * 标准化标签格式
     */
    normalizeTags(tags) {
        if (!tags) return 'ai,context,engineering';

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

        // 写入CSV
        const csvWriter = createObjectCsvWriter({
            path: this.readyToPushPath,
            header: [
                { id: 'title', title: 'title' },
                { id: 'description', title: 'description' },
                { id: 'tags', title: 'tags' },
                { id: 'file_path', title: 'file_path' },
                { id: 'devto_published', title: 'devto_published' },
                { id: 'hashnode_published', title: 'hashnode_published' },
                { id: 'author', title: 'author' }
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