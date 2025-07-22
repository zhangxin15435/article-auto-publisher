const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * 表格更新器 - 更新CSV和Excel文件中的发布状态
 */
class TableUpdater {
    constructor() {
        this.backupSuffix = '.backup';
    }

    /**
     * 更新表格文件中的发布状态
     * @param {string} filePath - 表格文件路径
     * @param {Array} articles - 包含更新信息的文章数组
     * @param {boolean} createBackup - 是否创建备份文件
     * @returns {Promise<object>} 更新结果
     */
    async updateFile(filePath, articles, createBackup = true) {
        try {
            // 创建备份
            if (createBackup) {
                await this.createBackup(filePath);
            }

            const ext = path.extname(filePath).toLowerCase();

            switch (ext) {
                case '.csv':
                    return await this.updateCSV(filePath, articles);
                case '.xlsx':
                case '.xls':
                    return await this.updateExcel(filePath, articles);
                default:
                    throw new Error(`不支持的文件格式: ${ext}`);
            }
        } catch (error) {
            throw new Error(`更新表格文件失败: ${error.message}`);
        }
    }

    /**
     * 更新CSV文件
     * @param {string} filePath - CSV文件路径
     * @param {Array} articles - 文章数组
     * @returns {Promise<object>} 更新结果
     */
    async updateCSV(filePath, articles) {
        try {
            // 读取原始文件获取表头
            const originalContent = await fs.readFile(filePath, 'utf8');
            const lines = originalContent.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

            // 构建更新后的数据
            const updatedRows = [];
            let updatedCount = 0;

            for (const article of articles) {
                const updatedRow = this.buildUpdatedRow(article, headers);
                updatedRows.push(updatedRow);

                if (article._updateStatus?.updated) {
                    updatedCount++;
                }
            }

            // 创建CSV写入器
            const csvWriter = createCsvWriter({
                path: filePath,
                header: headers.map(h => ({ id: h, title: h }))
            });

            // 写入更新后的数据
            await csvWriter.writeRecords(updatedRows);

            return {
                success: true,
                message: `CSV文件更新成功，共更新 ${updatedCount} 条记录`,
                updatedCount,
                totalCount: articles.length
            };

        } catch (error) {
            throw new Error(`CSV文件更新失败: ${error.message}`);
        }
    }

    /**
     * 更新Excel文件
     * @param {string} filePath - Excel文件路径
     * @param {Array} articles - 文章数组
     * @returns {Promise<object>} 更新结果
     */
    async updateExcel(filePath, articles) {
        try {
            // 读取原始工作簿
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 获取表头信息
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const headers = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                const cell = worksheet[cellAddress];
                headers.push(cell ? cell.v : '');
            }

            // 构建更新后的数据
            const updatedData = [];
            let updatedCount = 0;

            for (const article of articles) {
                const updatedRow = this.buildUpdatedRow(article, headers);
                updatedData.push(updatedRow);

                if (article._updateStatus?.updated) {
                    updatedCount++;
                }
            }

            // 创建新的工作表
            const newWorksheet = XLSX.utils.json_to_sheet(updatedData, { header: headers });

            // 替换原工作表
            workbook.Sheets[sheetName] = newWorksheet;

            // 写入文件
            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                message: `Excel文件更新成功，共更新 ${updatedCount} 条记录`,
                updatedCount,
                totalCount: articles.length
            };

        } catch (error) {
            throw new Error(`Excel文件更新失败: ${error.message}`);
        }
    }

    /**
     * 构建更新后的行数据
     * @param {object} article - 文章对象
     * @param {Array} headers - 表头数组
     * @returns {object} 更新后的行对象
     */
    buildUpdatedRow(article, headers) {
        const row = {};

        // 从原始行数据开始
        if (article._rawRow) {
            Object.assign(row, article._rawRow);
        }

        // 更新发布状态字段
        if (article._columns) {
            const columns = article._columns;

            // 更新DevTo状态
            if (columns.platform_devto && article.publishResults?.devto) {
                const devtoResult = article.publishResults.devto;
                if (devtoResult.success) {
                    row[columns.platform_devto] = devtoResult.url || '已发布';
                    article._updateStatus = { updated: true };
                }
            }

            // 更新Hashnode状态
            if (columns.platform_hashnode && article.publishResults?.hashnode) {
                const hashnodeResult = article.publishResults.hashnode;
                if (hashnodeResult.success) {
                    row[columns.platform_hashnode] = hashnodeResult.url || '已发布';
                    article._updateStatus = { updated: true };
                }
            }

            // 更新发布完成状态
            if (columns.publish_complete && article.publishResults) {
                const allPlatformsPublished = Object.values(article.publishResults)
                    .every(result => result.success);
                if (allPlatformsPublished) {
                    row[columns.publish_complete] = '是';
                }
            }

            // 更新最后发布时间（如果存在该列）
            const lastPublishedColumn = this.findColumn(headers, [
                'last_published', '最后发布时间', 'Last Published', 'updated_at'
            ]);

            if (lastPublishedColumn) {
                row[lastPublishedColumn] = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
            }
        }

        return row;
    }

    /**
     * 查找匹配的列名
     * @param {Array} headers - 表头数组
     * @param {Array} possibleNames - 可能的列名
     * @returns {string|null} 匹配的列名
     */
    findColumn(headers, possibleNames) {
        for (const name of possibleNames) {
            const found = headers.find(header =>
                header === name || header.toLowerCase() === name.toLowerCase()
            );
            if (found) return found;
        }
        return null;
    }

    /**
     * 创建备份文件
     * @param {string} filePath - 原文件路径
     * @returns {Promise<string>} 备份文件路径
     */
    async createBackup(filePath) {
        const backupPath = filePath + this.backupSuffix;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalBackupPath = backupPath.replace(this.backupSuffix, `_${timestamp}${this.backupSuffix}`);

        try {
            await fs.copyFile(filePath, finalBackupPath);
            console.log(`📦 已创建备份文件: ${path.basename(finalBackupPath)}`);
            return finalBackupPath;
        } catch (error) {
            console.warn(`⚠️ 创建备份文件失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 批量更新多个文章的发布状态
     * @param {string} filePath - 表格文件路径
     * @param {Array} publishResults - 发布结果数组
     * @param {Array} originalArticles - 原始文章数组
     * @returns {Promise<object>} 更新结果
     */
    async batchUpdate(filePath, publishResults, originalArticles) {
        try {
            // 将发布结果合并到原始文章数据中
            const articlesWithResults = originalArticles.map(article => {
                const results = publishResults.find(result =>
                    result.article === article.title
                );

                if (results) {
                    article.publishResults = {};

                    // 整理发布结果
                    for (const platformResult of results.results) {
                        if (platformResult.success) {
                            const platformName = platformResult.platform.toLowerCase();
                            article.publishResults[platformName] = platformResult;
                        }
                    }
                }

                return article;
            });

            // 更新文件
            return await this.updateFile(filePath, articlesWithResults);

        } catch (error) {
            throw new Error(`批量更新失败: ${error.message}`);
        }
    }

    /**
     * 验证更新权限
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 是否有更新权限
     */
    async validateUpdatePermission(filePath) {
        try {
            // 检查文件是否存在
            await fs.access(filePath, fs.constants.F_OK);

            // 检查写入权限
            await fs.access(filePath, fs.constants.W_OK);

            return true;
        } catch (error) {
            console.warn(`文件权限检查失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 获取更新统计信息
     * @param {Array} articles - 文章数组
     * @returns {object} 统计信息
     */
    getUpdateStats(articles) {
        const stats = {
            total: articles.length,
            updated: 0,
            devtoUpdated: 0,
            hashnodeUpdated: 0,
            errors: 0
        };

        for (const article of articles) {
            if (article._updateStatus?.updated) {
                stats.updated++;
            }

            if (article.publishResults?.devto?.success) {
                stats.devtoUpdated++;
            }

            if (article.publishResults?.hashnode?.success) {
                stats.hashnodeUpdated++;
            }

            if (article.publishResults?.error) {
                stats.errors++;
            }
        }

        return stats;
    }
}

module.exports = TableUpdater; 