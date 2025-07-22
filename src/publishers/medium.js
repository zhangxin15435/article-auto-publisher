/**
 * Medium发布器
 * 
 * 功能：
 * - 使用Cookie进行身份验证
 * - 发布文章到Medium平台
 * - 支持标签和发布状态设置
 * - 提供详细的错误处理和日志
 */

const https = require('https');
const chalk = require('chalk');

class MediumPublisher {
    constructor(options = {}) {
        this.config = {
            baseUrl: 'https://medium.com',
            cookies: options.cookies || process.env.MEDIUM_COOKIES,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            timeout: 30000
        };

        if (!this.config.cookies) {
            console.warn(chalk.yellow('⚠️  Medium cookies未配置'));
        }
    }

    /**
     * 验证配置
     */
    validateConfig() {
        const errors = [];

        if (!this.config.cookies) {
            errors.push('缺少Medium cookies配置');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 获取用户信息
     */
    async getUserInfo() {
        try {
            console.log(chalk.blue('📡 获取Medium用户信息...'));

            const response = await this.makeRequest('GET', '/me');

            if (response.success && response.data) {
                const userMatch = response.data.match(/"id":"([^"]+)"/);
                const usernameMatch = response.data.match(/"username":"([^"]+)"/);

                if (userMatch && usernameMatch) {
                    const userInfo = {
                        id: userMatch[1],
                        username: usernameMatch[1]
                    };

                    console.log(chalk.green('✅ 成功获取用户信息:'), userInfo.username);
                    return userInfo;
                }
            }

            throw new Error('无法解析用户信息');
        } catch (error) {
            console.error(chalk.red('❌ 获取用户信息失败:'), error.message);
            throw error;
        }
    }

    /**
     * 发布文章到Medium
     */
    async publishArticle(article) {
        try {
            const validation = this.validateConfig();
            if (!validation.isValid) {
                throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
            }

            console.log(chalk.blue(`📝 开始发布文章到Medium: "${article.title}"`));

            // 获取用户信息
            const userInfo = await this.getUserInfo();

            // 获取发布所需的token
            const publishToken = await this.getPublishToken();

            // 准备文章数据
            const articleData = this.prepareArticleData(article, userInfo, publishToken);

            // 发布文章
            const response = await this.publishToMedium(articleData);

            if (response.success) {
                console.log(chalk.green('✅ 文章发布成功!'));
                return {
                    success: true,
                    url: response.url,
                    platform: 'Medium',
                    publishedAt: new Date().toISOString()
                };
            } else {
                throw new Error(response.error || '发布失败');
            }

        } catch (error) {
            console.error(chalk.red('❌ Medium发布失败:'), error.message);
            return {
                success: false,
                error: error.message,
                platform: 'Medium'
            };
        }
    }

    /**
     * 获取发布Token
     */
    async getPublishToken() {
        try {
            const response = await this.makeRequest('GET', '/new-story');

            if (response.success && response.data) {
                const tokenMatch = response.data.match(/"_token":"([^"]+)"/);
                if (tokenMatch) {
                    return tokenMatch[1];
                }
            }

            throw new Error('无法获取发布token');
        } catch (error) {
            console.error(chalk.red('❌ 获取发布token失败:'), error.message);
            throw error;
        }
    }

    /**
     * 准备文章数据
     */
    prepareArticleData(article, userInfo, publishToken) {
        const tags = Array.isArray(article.tags)
            ? article.tags
            : (article.tags ? article.tags.split(',').map(tag => tag.trim()) : []);

        return {
            title: article.title,
            content: this.formatContent(article.content),
            tags: tags.slice(0, 5), // Medium最多支持5个标签
            publishStatus: article.draft ? 'draft' : 'public',
            userId: userInfo.id,
            _token: publishToken
        };
    }

    /**
     * 格式化内容
     */
    formatContent(content) {
        if (!content) return '';

        // 将Markdown转换为Medium支持的格式
        let formattedContent = content
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        return `<p>${formattedContent}</p>`;
    }

    /**
     * 发布到Medium
     */
    async publishToMedium(articleData) {
        try {
            const postData = JSON.stringify({
                title: articleData.title,
                content: articleData.content,
                tags: articleData.tags,
                publishStatus: articleData.publishStatus,
                _token: articleData._token
            });

            const response = await this.makeRequest('POST', '/api/stories', postData, {
                'Content-Type': 'application/json'
            });

            if (response.success) {
                const responseData = JSON.parse(response.data);
                if (responseData.success) {
                    return {
                        success: true,
                        url: `https://medium.com/@${articleData.userId}/${responseData.data.slug}`
                    };
                }
            }

            return { success: false, error: '发布请求失败' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 发送HTTP请求
     */
    makeRequest(method, path, data = null, additionalHeaders = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.config.baseUrl);

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Cookie': this.config.cookies,
                    'Referer': this.config.baseUrl,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                    ...additionalHeaders
                },
                timeout: this.config.timeout
            };

            if (data) {
                options.headers['Content-Length'] = Buffer.byteLength(data);
            }

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            data: responseData,
                            statusCode: res.statusCode,
                            headers: res.headers
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `HTTP ${res.statusCode}: ${responseData}`,
                            statusCode: res.statusCode
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`请求失败: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });

            if (data) {
                req.write(data);
            }

            req.end();
        });
    }
}

/**
 * 发布文章到Medium
 */
async function publishToMedium(article, options = {}) {
    const publisher = new MediumPublisher(options);
    return await publisher.publishArticle(article);
}

module.exports = {
    MediumPublisher,
    publishToMedium
}; 