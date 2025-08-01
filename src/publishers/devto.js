const axios = require('axios');

/**
 * 发布文章到 DEV.to
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 发布结果
 */
async function publishToDevTo(article, config, options = {}) {
    const { apiKey } = config;

    if (!apiKey) {
        throw new Error('DEV.to API密钥未配置');
    }

    // 准备文章数据
    const articleData = {
        article: {
            title: article.title,
            body_markdown: article.content,
            published: options.draft ? false : (article.published !== false),
            tags: Array.isArray(article.tags) ? article.tags :
                (typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : []),
            description: article.description || '',
            main_image: article.coverImage || undefined,
            canonical_url: article.canonicalUrl || undefined,
            series: article.frontMatter?.series || undefined
        }
    };

    // 移除undefined字段
    Object.keys(articleData.article).forEach(key => {
        if (articleData.article[key] === undefined) {
            delete articleData.article[key];
        }
    });

    try {
        const response = await axios.post('https://dev.to/api/articles', articleData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            timeout: 30000 // 30秒超时
        });

        return {
            success: true,
            id: response.data.id,
            url: response.data.url,
            platform: 'DEV.to',
            data: response.data
        };

    } catch (error) {
        // 处理不同类型的错误
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            // 根据HTTP状态码提供更详细的错误信息
            switch (status) {
                case 401:
                    throw new Error('API密钥无效或已过期');
                case 422:
                    const errors = data.error || data.errors || '数据验证失败';
                    throw new Error(`文章数据验证失败: ${JSON.stringify(errors)}`);
                case 429:
                    throw new Error('API请求频率限制，请稍后重试');
                default:
                    throw new Error(`API请求失败 (${status}): ${data.error || data.message || '未知错误'}`);
            }
        } else if (error.request) {
            throw new Error('网络连接失败，请检查网络连接');
        } else {
            throw new Error(`请求配置错误: ${error.message}`);
        }
    }
}

/**
 * 获取用户的已发布文章列表
 * @param {string} apiKey - API密钥
 * @param {number} page - 页码（从1开始）
 * @param {number} per_page - 每页数量（最大1000）
 * @returns {Promise<Array>} 文章列表
 */
async function getUserArticles(apiKey, page = 1, per_page = 30) {
    try {
        const response = await axios.get('https://dev.to/api/articles/me', {
            headers: {
                'api-key': apiKey
            },
            params: {
                page,
                per_page
            }
        });

        return response.data;
    } catch (error) {
        throw new Error(`获取文章列表失败: ${error.response?.data?.error || error.message}`);
    }
}

/**
 * 更新已发布的文章
 * @param {number} articleId - 文章ID
 * @param {object} article - 更新的文章数据
 * @param {string} apiKey - API密钥
 * @returns {Promise<object>} 更新结果
 */
async function updateArticle(articleId, article, apiKey) {
    const articleData = {
        article: {
            title: article.title,
            body_markdown: article.content,
            published: article.published !== false,
            tags: Array.isArray(article.tags) ? article.tags :
                (typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : []),
            description: article.description || '',
            main_image: article.coverImage || undefined,
            canonical_url: article.canonicalUrl || undefined
        }
    };

    try {
        const response = await axios.put(`https://dev.to/api/articles/${articleId}`, articleData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            }
        });

        return {
            success: true,
            id: response.data.id,
            url: response.data.url,
            platform: 'DEV.to',
            data: response.data
        };
    } catch (error) {
        throw new Error(`更新文章失败: ${error.response?.data?.error || error.message}`);
    }
}

/**
 * 检查文章是否已经存在（基于标题匹配）
 * @param {string} title - 文章标题
 * @param {string} apiKey - API密钥
 * @returns {Promise<object|null>} 如果存在返回文章信息，否则返回null
 */
async function checkArticleExists(title, apiKey) {
    try {
        const articles = await getUserArticles(apiKey, 1, 100); // 获取前100篇文章
        return articles.find(article => article.title === title) || null;
    } catch (error) {
        console.warn('检查文章是否存在时出错:', error.message);
        return null;
    }
}

/**
 * 智能发布：如果文章存在则更新，否则创建新文章
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 发布结果
 */
async function smartPublish(article, config, options = {}) {
    const existingArticle = await checkArticleExists(article.title, config.apiKey);

    if (existingArticle && !options.forceNew) {
        console.log(`发现同名文章，正在更新: ${existingArticle.title}`);
        return await updateArticle(existingArticle.id, article, config.apiKey);
    } else {
        return await publishToDevTo(article, config, options);
    }
}

module.exports = {
    publishToDevTo,
    getUserArticles,
    updateArticle,
    checkArticleExists,
    smartPublish
}; 