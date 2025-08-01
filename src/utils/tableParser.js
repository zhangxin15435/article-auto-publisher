const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const { createReadStream } = require('fs');
const MarkdownReader = require('./markdownReader'); // 新增

/**
 * 表格解析器 - 支持CSV和Excel格式
 * 处理包含文章信息的表格文件，支持从Markdown文件加载内容
 */
class TableParser {
    constructor() {
        // 必需的列名映射（支持中英文）
        this.requiredColumns = {
            title: ['title', '标题', 'Title', '文章标题', '主题'],
            content: ['content', '内容', 'Content', '文章内容', 'body', 'markdown', '发布内容'],
            description: ['description', '描述', 'Description', '文章描述', 'summary', '摘要'],
            tags: ['tags', '标签', 'Tags', '标签列表', 'markdown格标签'],
            published: ['published', '发布状态', 'Published', '是否发布', 'status', '状态', '发布'],
            cover_image: ['cover_image', '封面图片', 'Cover Image', 'coverImage', 'image', '图片'],
            canonical_url: ['canonical_url', '原文链接', 'Canonical URL', 'canonicalUrl', 'url', '链接'],
            series: ['series', '系列', 'Series', '系列名称'],
            file_path: ['file_path', '文件路径', 'File Path', 'filePath', 'path', '路径', 'md文件', 'markdown文件', '发布内容'],
            platform_devto: ['devto_published', 'devto_状态', 'devto_url', 'DevTo Published', 'dev_to'],
            platform_hashnode: ['hashnode_published', 'hashnode_状态', 'hashnode_url', 'Hashnode Published'],
            author: ['author', '作者', 'Author', '提出人'],
            format_conversion: ['format_conversion', '格式转换', 'Format Conversion'],
            channels: ['channels', '渠道', '渠道&账号', 'Channels'],
            publish_complete: ['publish_complete', '发布完成', 'Publish Complete', '完成状态']
        };

        this.markdownReader = new MarkdownReader(); // 新增：初始化Markdown读取器
    }

    /**
     * 解析表格文件（主入口方法）
     * @param {string} filePath - 表格文件路径
     * @returns {Promise<Array>} 解析后的文章数据数组
     */
    async parseTableFile(filePath) {
        return await this.parseFile(filePath);
    }

    /**
     * 解析表格文件
     * @param {string} filePath - 表格文件路径
     * @returns {Promise<Array>} 解析后的文章数据数组
     */
    async parseFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        switch (ext) {
            case '.csv':
                return await this.parseCSV(filePath);
            case '.xlsx':
            case '.xls':
                return await this.parseExcel(filePath);
            default:
                throw new Error(`不支持的文件格式: ${ext}`);
        }
    }

    /**
     * 解析CSV文件
     * @param {string} filePath - CSV文件路径
     * @returns {Promise<array>} 文章数组
     */
    async parseCSV(filePath) {
        // 检查是否包含多行文本（通过检查文件内容）
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        // 如果文件行数明显多于预期的记录数，使用csv-parse
        if (lines.length > 50) {
            return this.parseCSVWithMultiline(filePath);
        }

        // 否则使用原来的csv-parser
        return new Promise((resolve, reject) => {
            const results = [];

            createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        const article = this.processRow(row, filePath); // 传递filePath参数
                        if (article) {
                            results.push(article);
                        }
                    } catch (error) {
                        console.warn(`处理行数据时出错:`, error.message);
                    }
                })
                .on('end', async () => {
                    try {
                        // 处理需要从Markdown文件加载内容的文章
                        const processedResults = await this.loadMarkdownContent(results, filePath);
                        console.log(`✅ CSV文件解析完成，共解析 ${processedResults.length} 条记录`);
                        resolve(processedResults);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    /**
     * 使用csv-parse解析包含多行文本的CSV文件
     * @param {string} filePath - CSV文件路径
     * @returns {Promise<array>} 文章数组
     */
    async parseCSVWithMultiline(filePath) {
        const self = this; // 保存this引用
        return new Promise((resolve, reject) => {
            const results = [];
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,           // 宽松的引号处理
                relax_column_count: true,     // 宽松的列数处理
                trim: true,                   // 自动去除空格
                cast: (value) => {
                    // 处理值的转换
                    return value ? value.trim() : '';
                }
            })
                .on('readable', function () {
                    let record;
                    while ((record = this.read()) !== null) {
                        try {
                            const article = self.processRow(record, filePath); // 传递filePath参数
                            if (article) {
                                results.push(article);
                            }
                        } catch (error) {
                            console.warn(`处理行数据时出错:`, error.message);
                        }
                    }
                })
                .on('end', async () => {
                    try {
                        // 处理需要从Markdown文件加载内容的文章
                        const processedResults = await self.loadMarkdownContent(results, filePath);
                        console.log(`✅ CSV文件解析完成（多行模式），共解析 ${processedResults.length} 条记录`);
                        resolve(processedResults);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', reject);
        });
    }

    /**
     * 解析Excel文件
     * @param {string} filePath - Excel文件路径
     * @returns {Promise<Array>} 解析后的数据
     */
    async parseExcel(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // 使用第一个工作表
            const worksheet = workbook.Sheets[sheetName];

            // 将工作表转换为JSON格式
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            const results = [];
            for (const row of rawData) {
                try {
                    const article = this.processRow(row, filePath); // 传递filePath参数
                    if (article) {
                        results.push(article);
                    }
                } catch (error) {
                    console.warn(`处理行数据时出错:`, error.message);
                }
            }

            // 处理需要从Markdown文件加载内容的文章
            const processedResults = await this.loadMarkdownContent(results, filePath);
            console.log(`✅ Excel文件解析完成，共解析 ${processedResults.length} 条记录`);
            return processedResults;

        } catch (error) {
            throw new Error(`Excel文件解析失败: ${error.message}`);
        }
    }

    /**
     * 处理单行数据，将其转换为文章对象
     * @param {object} row - 行数据
     * @param {string} tableFilePath - 表格文件路径（用于确定articles目录）
     * @returns {object|null} 文章对象或null
     */
    processRow(row, tableFilePath) {
        // 查找列名映射
        const columns = this.findColumns(row);

        // 检查必需字段
        if (!columns.title && !columns.file_path) {
            console.warn('跳过无标题且无文件路径的行:', Object.keys(row).slice(0, 3));
            return null;
        }

        const article = {
            // 基本信息（如果有直接内容则使用，否则标记需要从文件加载）
            title: this.cleanValue(row[columns.title]),
            content: this.cleanValue(row[columns.content]) || '', // 如果没有直接内容，稍后从文件加载
            description: this.cleanValue(row[columns.description]) || '',

            // 标签处理
            tags: this.parseTags(row[columns.tags]),

            // 发布状态
            published: this.parseBoolean(row[columns.published], true),

            // 可选字段
            coverImage: this.cleanValue(row[columns.cover_image]) || undefined,
            canonicalUrl: this.cleanValue(row[columns.canonical_url]) || undefined,
            series: this.cleanValue(row[columns.series]) || undefined,
            filePath: this.cleanValue(row[columns.file_path]) || undefined,

            // 新增字段
            author: this.cleanValue(row[columns.author]) || undefined,
            formatConversion: this.cleanValue(row[columns.format_conversion]) || undefined,
            channels: this.cleanValue(row[columns.channels]) || undefined,
            publishComplete: this.parseBoolean(row[columns.publish_complete], false),

            // 平台发布状态
            devto_published: this.parsePlatformStatus(row[columns.platform_devto]).published ?
                (row[columns.platform_devto] || '是') : false,
            hashnode_published: this.parsePlatformStatus(row[columns.platform_hashnode]).published ?
                (row[columns.platform_hashnode] || '是') : false,

            // 内部使用字段
            _needsMarkdownLoad: !this.cleanValue(row[columns.content]) && this.cleanValue(row[columns.file_path]), // 标记是否需要从MD文件加载内容
            _tableFilePath: tableFilePath, // 保存表格文件路径
            _rawRow: row,
            _columns: columns
        };

        return article;
    }

    /**
     * 从Markdown文件加载内容
     * @param {Array} articles - 文章数组
     * @param {string} tableFilePath - 表格文件路径
     * @returns {Promise<Array>} 加载内容后的文章数组
     */
    async loadMarkdownContent(articles, tableFilePath) {
        const articlesDir = path.dirname(tableFilePath); // 使用表格文件所在目录作为articles目录
        const processedArticles = [];

        for (const article of articles) {
            if (article._needsMarkdownLoad && article.filePath) {
                try {
                    console.log(`📖 从Markdown文件加载内容: ${article.filePath}`);

                    // 使用MarkdownReader读取文件内容
                    const markdownArticle = await this.markdownReader.readMarkdownFile(
                        article.filePath,
                        articlesDir
                    );

                    // 合并数据：内容字段以MD文件为准，配置字段以CSV为准
                    const mergedArticle = {
                        // 第一层：MD文件的所有数据作为基础
                        ...markdownArticle,

                        // 第二层：CSV中的配置字段覆盖（保留发布配置、作者等）
                        // 但内容相关字段让MD文件保持优先
                        ...(function () {
                            const csvData = { ...article };
                            // 删除内容相关字段，让MD文件的保持优先
                            delete csvData.title;      // 标题用MD文件的
                            delete csvData.content;    // 内容用MD文件的
                            delete csvData.description; // 描述优先用MD文件的，除非MD文件没有
                            delete csvData.tags;       // 标签优先用MD文件的，除非MD文件没有
                            return csvData;
                        })(),

                        // 第三层：智能合并逻辑 - 优先使用MD文件，CSV作为补充
                        title: markdownArticle.title || article.title,
                        content: markdownArticle.content || article.content,

                        // 描述和标签：如果MD文件有就用MD的，否则用CSV的
                        description: markdownArticle.description || article.description,
                        tags: (markdownArticle.tags && markdownArticle.tags.length > 0) ?
                            markdownArticle.tags : article.tags,

                        // 作者：CSV优先，如果CSV没有则用MD文件的
                        author: article.author || markdownArticle.author,

                        // 保留MD文件的原始信息
                        markdownData: {
                            frontMatter: markdownArticle.frontMatter,
                            fileName: markdownArticle.fileName,
                            fileSize: markdownArticle.fileSize,
                            lastModified: markdownArticle.lastModified
                        }
                    };

                    // 清理内部标记字段
                    delete mergedArticle._needsMarkdownLoad;

                    processedArticles.push(mergedArticle);

                } catch (error) {
                    console.warn(`⚠️ 无法加载Markdown文件 ${article.filePath}: ${error.message}`);

                    // 即使加载失败，也保留原有的文章数据
                    delete article._needsMarkdownLoad;
                    processedArticles.push(article);
                }
            } else {
                // 不需要从MD文件加载内容的文章直接添加
                delete article._needsMarkdownLoad;
                processedArticles.push(article);
            }
        }

        return processedArticles;
    }

    /**
     * 查找列名映射
     * @param {object} row - 行数据
     * @returns {object} 列名映射对象
     */
    findColumns(row) {
        const columns = {};
        const availableKeys = Object.keys(row);

        for (const [field, possibleNames] of Object.entries(this.requiredColumns)) {
            for (const name of possibleNames) {
                // 精确匹配或忽略大小写匹配
                const found = availableKeys.find(key =>
                    key === name || key.toLowerCase() === name.toLowerCase()
                );
                if (found) {
                    columns[field] = found;
                    break;
                }
            }
        }

        return columns;
    }

    /**
     * 清理字符串值
     * @param {any} value - 原始值
     * @returns {string|undefined} 清理后的值
     */
    cleanValue(value) {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }

        const str = String(value).trim();
        return str === '' ? undefined : str;
    }

    /**
     * 解析标签
     * @param {string} tagsValue - 标签字符串
     * @returns {Array} 标签数组
     */
    parseTags(tagsValue) {
        if (!tagsValue) return [];

        const str = String(tagsValue).trim();
        if (!str) return [];

        // 支持多种分隔符：逗号、分号、空格、中文逗号
        return str.split(/[,;，；\s]+/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    /**
     * 解析布尔值
     * @param {any} value - 原始值
     * @param {boolean} defaultValue - 默认值
     * @returns {boolean} 布尔值
     */
    parseBoolean(value, defaultValue = false) {
        if (value === null || value === undefined || value === '') {
            return defaultValue;
        }

        const str = String(value).toLowerCase().trim();

        // 支持多种真值表示
        const trueValues = ['true', '1', 'yes', 'y', '是', '已发布', 'published'];
        const falseValues = ['false', '0', 'no', 'n', '否', '未发布', 'draft', '草稿'];

        if (trueValues.includes(str)) return true;
        if (falseValues.includes(str)) return false;

        return defaultValue;
    }

    /**
     * 解析平台发布状态
     * @param {any} value - 平台状态值
     * @returns {object} 平台状态对象
     */
    parsePlatformStatus(value) {
        if (!value) {
            return { published: false, url: null, id: null };
        }

        const str = String(value).trim();

        // 如果是URL格式
        if (str.startsWith('http')) {
            return { published: true, url: str, id: null };
        }

        // 如果是布尔值
        const published = this.parseBoolean(str, false);
        return { published, url: null, id: null };
    }

    /**
     * 验证表格格式
     * @param {string} filePath - 文件路径
     * @returns {Promise<object>} 验证结果
     */
    async validateFormat(filePath) {
        try {
            const sampleData = await this.parseFile(filePath);

            if (sampleData.length === 0) {
                return {
                    valid: false,
                    message: '表格文件为空或没有有效数据',
                    suggestions: ['确保表格包含标题行', '检查是否有文章数据']
                };
            }

            const firstRow = sampleData[0];
            const missing = [];

            // 检查必需字段
            if (!firstRow.title && !firstRow.filePath) {
                missing.push('标题(title)或文件路径(file_path)');
            }
            if (!firstRow.content && !firstRow.filePath) {
                missing.push('内容(content)或文件路径(file_path)');
            }

            if (missing.length > 0) {
                return {
                    valid: false,
                    message: `缺少必需字段: ${missing.join(', ')}`,
                    suggestions: [
                        '确保表格包含标题列或文件路径列',
                        '如果没有content列，请提供file_path列指向Markdown文件',
                        '查看示例模板了解正确格式'
                    ]
                };
            }

            return {
                valid: true,
                message: `表格格式验证通过，找到 ${sampleData.length} 条记录`,
                data: sampleData
            };

        } catch (error) {
            return {
                valid: false,
                message: `文件解析失败: ${error.message}`,
                suggestions: [
                    '检查文件格式是否正确',
                    '确保文件没有损坏',
                    '尝试重新保存文件'
                ]
            };
        }
    }

    /**
     * 获取未发布的文章
     * @param {Array} articles - 文章数组
     * @returns {Array} 未发布的文章列表
     */
    getUnpublishedArticles(articles) {
        return articles.filter(article => {
            // 检查是否所有平台都已发布
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
    }
}

module.exports = TableParser; 