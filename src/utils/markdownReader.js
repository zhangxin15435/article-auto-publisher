const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

/**
 * Markdown文件读取器
 * 负责读取和解析Markdown文件，提取frontmatter和内容
 */
class MarkdownReader {
    constructor(baseDir = '') {
        this.baseDir = baseDir;
    }

    /**
     * 读取并解析Markdown文件
     * @param {string} filePath - md文件路径（相对或绝对）
     * @param {string} articlesDir - articles目录路径
     * @returns {Promise<object>} 解析后的文章数据
     */
    async readMarkdownFile(filePath, articlesDir) {
        try {
            // 构建完整的文件路径
            let fullPath;

            if (path.isAbsolute(filePath)) {
                fullPath = filePath;
            } else {
                // 相对路径，在articles目录中查找
                fullPath = path.join(articlesDir, filePath);

                // 如果文件不存在且没有.md扩展名，尝试添加.md
                if (!await this.fileExists(fullPath) && !filePath.endsWith('.md')) {
                    fullPath = path.join(articlesDir, filePath + '.md');
                }
            }

            // 检查文件是否存在
            if (!await this.fileExists(fullPath)) {
                throw new Error(`Markdown文件不存在: ${filePath}`);
            }

            // 读取文件内容
            const fileContent = await fs.readFile(fullPath, 'utf8');

            // 解析frontmatter和内容
            const { data: frontMatter, content } = matter(fileContent);

            // 处理正文内容，去除开头的标题
            const processedContent = this.removeLeadingTitle(content.trim());

            // 构建文章对象
            const article = {
                // 基本信息
                title: frontMatter.title || this.extractTitleFromContent(content) || path.basename(filePath, '.md'),
                content: processedContent,
                description: frontMatter.description || frontMatter.excerpt || '',

                // 标签和分类
                tags: this.normalizeTags(frontMatter.tags),
                categories: this.normalizeTags(frontMatter.categories),

                // 发布设置
                published: frontMatter.published !== false, // 默认为true
                draft: frontMatter.draft === true,

                // 图片和链接
                coverImage: frontMatter.cover_image || frontMatter.coverImage || frontMatter.image,
                canonicalUrl: frontMatter.canonical_url || frontMatter.canonicalUrl,

                // 元数据
                author: frontMatter.author || '',
                date: frontMatter.date || new Date().toISOString(),
                series: frontMatter.series || '',

                // 原始数据
                frontMatter: frontMatter,
                filePath: fullPath,
                relativePath: filePath,

                // 文件信息
                fileName: path.basename(fullPath),
                fileSize: (await fs.stat(fullPath)).size,
                lastModified: (await fs.stat(fullPath)).mtime
            };

            return article;

        } catch (error) {
            throw new Error(`读取Markdown文件失败 (${filePath}): ${error.message}`);
        }
    }

    /**
     * 批量读取多个Markdown文件
     * @param {Array} filePaths - 文件路径数组
     * @param {string} articlesDir - articles目录路径
     * @returns {Promise<Array>} 文章数组
     */
    async readMultipleFiles(filePaths, articlesDir) {
        const articles = [];
        const errors = [];

        for (const filePath of filePaths) {
            try {
                const article = await this.readMarkdownFile(filePath, articlesDir);
                articles.push(article);
            } catch (error) {
                console.warn(`⚠️ 跳过文件 ${filePath}: ${error.message}`);
                errors.push({ filePath, error: error.message });
            }
        }

        return { articles, errors };
    }

    /**
     * 从内容中提取标题（如果frontmatter中没有）
     * @param {string} content - 文章内容
     * @returns {string|null} 提取的标题
     */
    extractTitleFromContent(content) {
        const lines = content.split('\n');

        // 查找第一个 # 标题
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
        }

        return null;
    }

    /**
     * 标准化标签格式
     * @param {any} tags - 标签数据
     * @returns {Array} 标准化的标签数组
     */
    normalizeTags(tags) {
        if (!tags) return [];

        if (Array.isArray(tags)) {
            return tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
        }

        if (typeof tags === 'string') {
            return tags.split(/[,;，；\s]+/)
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }

        return [];
    }

    /**
     * 检查文件是否存在
     * @param {string} filePath - 文件路径
     * @returns {Promise<boolean>} 文件是否存在
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证Markdown文件格式
     * @param {string} filePath - 文件路径
     * @param {string} articlesDir - articles目录路径
     * @returns {Promise<object>} 验证结果
     */
    async validateMarkdownFile(filePath, articlesDir) {
        try {
            const article = await this.readMarkdownFile(filePath, articlesDir);

            const issues = [];

            // 检查必需字段
            if (!article.title || article.title.trim() === '') {
                issues.push('缺少文章标题');
            }

            if (!article.content || article.content.trim() === '') {
                issues.push('文章内容为空');
            }

            // 检查内容长度
            if (article.content && article.content.length < 100) {
                issues.push('文章内容过短（少于100字符）');
            }

            // 检查标签
            if (article.tags.length === 0) {
                issues.push('建议添加标签以提高文章可发现性');
            }

            return {
                valid: issues.length === 0,
                article: article,
                issues: issues,
                warnings: issues.length > 0 ? issues : undefined
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message,
                issues: [error.message]
            };
        }
    }

    /**
     * 搜索articles目录中的所有Markdown文件
     * @param {string} articlesDir - articles目录路径
     * @param {object} options - 搜索选项
     * @returns {Promise<Array>} 找到的md文件路径数组
     */
    async findMarkdownFiles(articlesDir, options = {}) {
        const { recursive = true, pattern = null } = options;

        try {
            const files = await this.scanDirectory(articlesDir, recursive);

            // 过滤.md文件
            let markdownFiles = files.filter(file =>
                file.toLowerCase().endsWith('.md') || file.toLowerCase().endsWith('.markdown')
            );

            // 应用模式过滤
            if (pattern) {
                const regex = new RegExp(pattern, 'i');
                markdownFiles = markdownFiles.filter(file => regex.test(file));
            }

            return markdownFiles.map(file => path.relative(articlesDir, file));

        } catch (error) {
            throw new Error(`搜索Markdown文件失败: ${error.message}`);
        }
    }

    /**
     * 递归扫描目录
     * @param {string} dirPath - 目录路径
     * @param {boolean} recursive - 是否递归
     * @returns {Promise<Array>} 文件路径数组
     */
    async scanDirectory(dirPath, recursive = true) {
        const files = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isFile()) {
                    files.push(fullPath);
                } else if (entry.isDirectory() && recursive) {
                    const subFiles = await this.scanDirectory(fullPath, recursive);
                    files.push(...subFiles);
                }
            }

        } catch (error) {
            console.warn(`扫描目录失败 ${dirPath}: ${error.message}`);
        }

        return files;
    }

    /**
     * 去除正文内容开头的标题行
     * @param {string} content - 原始正文内容
     * @returns {string} 处理后的正文内容
     */
    removeLeadingTitle(content) {
        if (!content) return '';

        const lines = content.split('\n');
        let contentStartIndex = 0;

        // 查找第一个非空行
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 跳过空行
            if (line === '') {
                continue;
            }

            // 如果第一个非空行是一级标题，则跳过它
            if (line.startsWith('# ')) {
                contentStartIndex = i + 1;
                // 继续跳过标题后的空行
                while (contentStartIndex < lines.length && lines[contentStartIndex].trim() === '') {
                    contentStartIndex++;
                }
                break;
            } else {
                // 如果第一个非空行不是标题，则保留所有内容
                contentStartIndex = 0;
                break;
            }
        }

        // 返回处理后的内容
        const processedLines = lines.slice(contentStartIndex);
        return processedLines.join('\n').trim();
    }
}

module.exports = MarkdownReader; 