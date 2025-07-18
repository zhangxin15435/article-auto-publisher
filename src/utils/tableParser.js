const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { createReadStream } = require('fs');

/**
 * 表格解析器 - 支持CSV和Excel格式
 * 处理包含文章信息的表格文件
 */
class TableParser {
    constructor() {
        // 必需的列名映射（支持中英文）
        this.requiredColumns = {
            title: ['title', '标题', 'Title', '文章标题'],
            content: ['content', '内容', 'Content', '文章内容', 'body', 'markdown'],
            description: ['description', '描述', 'Description', '文章描述', 'summary', '摘要'],
            tags: ['tags', '标签', 'Tags', '标签列表'],
            published: ['published', '发布状态', 'Published', '是否发布', 'status', '状态'],
            cover_image: ['cover_image', '封面图片', 'Cover Image', 'coverImage', 'image', '图片'],
            canonical_url: ['canonical_url', '原文链接', 'Canonical URL', 'canonicalUrl', 'url', '链接'],
            series: ['series', '系列', 'Series', '系列名称'],
            file_path: ['file_path', '文件路径', 'File Path', 'filePath', 'path', '路径'],
            platform_devto: ['devto_published', 'devto_状态', 'devto_url', 'DevTo Published', 'dev_to'],
            platform_hashnode: ['hashnode_published', 'hashnode_状态', 'hashnode_url', 'Hashnode Published']
        };
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
     * @returns {Promise<Array>} 解析后的数据
     */
    async parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];

            createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        const article = this.processRow(row);
                        if (article) {
                            results.push(article);
                        }
                    } catch (error) {
                        console.warn(`处理行数据时出错:`, error.message);
                    }
                })
                .on('end', () => {
                    console.log(`✅ CSV文件解析完成，共解析 ${results.length} 条记录`);
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(new Error(`CSV文件解析失败: ${error.message}`));
                });
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
                    const article = this.processRow(row);
                    if (article) {
                        results.push(article);
                    }
                } catch (error) {
                    console.warn(`处理行数据时出错:`, error.message);
                }
            }

            console.log(`✅ Excel文件解析完成，共解析 ${results.length} 条记录`);
            return results;

        } catch (error) {
            throw new Error(`Excel文件解析失败: ${error.message}`);
        }
    }

    /**
     * 处理单行数据，将其转换为文章对象
     * @param {object} row - 行数据
     * @returns {object|null} 文章对象或null
     */
    processRow(row) {
        // 查找列名映射
        const columns = this.findColumns(row);

        // 检查必需字段
        if (!columns.title) {
            console.warn('跳过无标题的行:', Object.keys(row).slice(0, 3));
            return null;
        }

        const article = {
            // 基本信息
            title: this.cleanValue(row[columns.title]),
            content: this.cleanValue(row[columns.content]) || '',
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

            // 平台发布状态
            platformStatus: {
                devto: this.parsePlatformStatus(row[columns.platform_devto]),
                hashnode: this.parsePlatformStatus(row[columns.platform_hashnode])
            },

            // 原始行数据（用于更新）
            _rawRow: row,
            _columns: columns
        };

        return article;
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
            if (!firstRow.title) missing.push('标题(title)');
            if (!firstRow.content && !firstRow.filePath) {
                missing.push('内容(content)或文件路径(file_path)');
            }

            if (missing.length > 0) {
                return {
                    valid: false,
                    message: `缺少必需字段: ${missing.join(', ')}`,
                    suggestions: [
                        '确保表格包含标题列',
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
            const devtoPublished = article.platformStatus?.devto?.published || false;
            const hashnodePublished = article.platformStatus?.hashnode?.published || false;

            // 如果任一平台未发布，则认为文章未完全发布
            return !devtoPublished || !hashnodePublished;
        });
    }
}

module.exports = TableParser; 