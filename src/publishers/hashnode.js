const axios = require('axios');

/**
 * 发布文章到 Hashnode
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 发布结果
 */
async function publishToHashnode(article, config, options = {}) {
    const { apiKey, publicationId } = config;

    if (!apiKey) {
        throw new Error('Hashnode API密钥未配置');
    }

    if (!publicationId) {
        throw new Error('Hashnode Publication ID未配置');
    }

    // 创建草稿的GraphQL mutation
    const createDraftMutation = `
    mutation CreateDraft($input: CreateDraftInput!) {
      createDraft(input: $input) {
        draft {
          id
          slug
          title
          content {
            markdown
          }
        }
      }
    }
  `;

    // 发布文章的GraphQL mutation
    const publishPostMutation = `
    mutation PublishDraft($input: PublishDraftInput!) {
      publishDraft(input: $input) {
        post {
          id
          slug
          title
          url
          publishedAt
        }
      }
    }
  `;

    // 准备标签数据
    const tags = Array.isArray(article.tags) ? article.tags :
        (typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim()) : []);

    // 构建输入数据
    const draftInput = {
        title: article.title,
        contentMarkdown: article.content,
        publicationId: publicationId,
        tags: tags.map(tag => ({ slug: tag.toLowerCase().replace(/[^a-z0-9]/g, '-'), name: tag })),
        subtitle: article.description ?
            (article.description.length > 250 ?
                article.description.substring(0, 247) + '...' :
                article.description) : undefined,
        coverImageOptions: article.coverImage ? {
            coverImageURL: article.coverImage
        } : undefined,
        originalArticleURL: article.canonicalUrl || undefined,
        metaTags: {
            title: article.title,
            description: article.description ?
                (article.description.length > 160 ?
                    article.description.substring(0, 157) + '...' :
                    article.description) : ''
        }
    };

    // 移除undefined字段
    Object.keys(draftInput).forEach(key => {
        if (draftInput[key] === undefined) {
            delete draftInput[key];
        }
    });

    try {
        // 第一步：创建草稿
        const draftResponse = await axios.post('https://gql.hashnode.com/', {
            query: createDraftMutation,
            variables: { input: draftInput }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            timeout: 30000
        });

        if (draftResponse.data.errors) {
            throw new Error(`创建草稿失败: ${JSON.stringify(draftResponse.data.errors)}`);
        }

        const draft = draftResponse.data.data.createDraft.draft;

        // 如果只是创建草稿，则返回草稿信息
        if (options.draft || article.published === false) {
            return {
                success: true,
                id: draft.id,
                slug: draft.slug,
                platform: 'Hashnode',
                status: 'draft',
                data: draft
            };
        }

        // 第二步：发布草稿
        const publishResponse = await axios.post('https://gql.hashnode.com/', {
            query: publishPostMutation,
            variables: {
                input: {
                    draftId: draft.id
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });

        if (publishResponse.data.errors) {
            throw new Error(`发布草稿失败: ${JSON.stringify(publishResponse.data.errors)}`);
        }

        const post = publishResponse.data.data.publishDraft.post;

        return {
            success: true,
            id: post.id,
            url: post.url,
            slug: post.slug,
            platform: 'Hashnode',
            status: 'published',
            data: post
        };

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            switch (status) {
                case 401:
                    throw new Error('API密钥无效或已过期');
                case 403:
                    throw new Error('没有权限访问该Publication，请检查Publication ID');
                case 400:
                    throw new Error(`请求数据格式错误: ${data.errors?.[0]?.message || '未知错误'}`);
                default:
                    throw new Error(`API请求失败 (${status}): ${data.errors?.[0]?.message || '未知错误'}`);
            }
        } else if (error.request) {
            throw new Error('网络连接失败，请检查网络连接');
        } else {
            throw new Error(`请求配置错误: ${error.message}`);
        }
    }
}

/**
 * 获取用户的Publication信息
 * @param {string} apiKey - API密钥
 * @returns {Promise<object>} Publication信息
 */
async function getUserPublications(apiKey) {
    const query = `
    query Me {
      me {
        id
        username
        publications(first: 10) {
          edges {
            node {
              id
              title
              displayTitle
              url
              posts(first: 1) {
                totalDocuments
              }
            }
          }
        }
      }
    }
  `;

    try {
        const response = await axios.post('https://gql.hashnode.com/', {
            query
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.errors) {
            throw new Error(`获取Publication列表失败: ${JSON.stringify(response.data.errors)}`);
        }

        return response.data.data.me;
    } catch (error) {
        throw new Error(`获取Publication信息失败: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}

/**
 * 获取Publication的文章列表
 * @param {string} apiKey - API密钥
 * @param {string} publicationId - Publication ID
 * @param {number} first - 获取数量
 * @returns {Promise<Array>} 文章列表
 */
async function getPublicationPosts(apiKey, publicationId, first = 20) {
    const query = `
    query Publication($id: ObjectId!, $first: Int!) {
      publication(id: $id) {
        id
        title
        posts(first: $first) {
          edges {
            node {
              id
              title
              slug
              url
              publishedAt
              content {
                markdown
              }
            }
          }
        }
      }
    }
  `;

    try {
        const response = await axios.post('https://gql.hashnode.com/', {
            query,
            variables: { id: publicationId, first }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.errors) {
            throw new Error(`获取文章列表失败: ${JSON.stringify(response.data.errors)}`);
        }

        return response.data.data.publication.posts.edges.map(edge => edge.node);
    } catch (error) {
        throw new Error(`获取文章列表失败: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}

/**
 * 更新已发布的文章
 * @param {string} postId - 文章ID
 * @param {object} article - 更新的文章数据
 * @param {string} apiKey - API密钥
 * @returns {Promise<object>} 更新结果
 */
async function updatePost(postId, article, apiKey) {
    const updateMutation = `
    mutation UpdatePost($input: UpdatePostInput!) {
      updatePost(input: $input) {
        post {
          id
          title
          slug
          url
        }
      }
    }
  `;

    const updateInput = {
        id: postId,
        title: article.title,
        contentMarkdown: article.content,
        subtitle: article.description || undefined,
        coverImageOptions: article.coverImage ? {
            coverImageURL: article.coverImage
        } : undefined
    };

    // 移除undefined字段
    Object.keys(updateInput).forEach(key => {
        if (updateInput[key] === undefined) {
            delete updateInput[key];
        }
    });

    try {
        const response = await axios.post('https://gql.hashnode.com/', {
            query: updateMutation,
            variables: { input: updateInput }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });

        if (response.data.errors) {
            throw new Error(`更新文章失败: ${JSON.stringify(response.data.errors)}`);
        }

        return {
            success: true,
            id: response.data.data.updatePost.post.id,
            url: response.data.data.updatePost.post.url,
            platform: 'Hashnode',
            data: response.data.data.updatePost.post
        };
    } catch (error) {
        throw new Error(`更新文章失败: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}

/**
 * 检查文章是否已经存在（基于标题匹配）
 * @param {string} title - 文章标题
 * @param {string} apiKey - API密钥
 * @param {string} publicationId - Publication ID
 * @returns {Promise<object|null>} 如果存在返回文章信息，否则返回null
 */
async function checkArticleExists(title, apiKey, publicationId) {
    try {
        const posts = await getPublicationPosts(apiKey, publicationId, 50);
        return posts.find(post => post.title === title) || null;
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
    const existingPost = await checkArticleExists(article.title, config.apiKey, config.publicationId);

    if (existingPost && !options.forceNew) {
        console.log(`发现同名文章，正在更新: ${existingPost.title}`);
        return await updatePost(existingPost.id, article, config.apiKey);
    } else {
        return await publishToHashnode(article, config, options);
    }
}

module.exports = {
    publishToHashnode,
    getUserPublications,
    getPublicationPosts,
    updatePost,
    checkArticleExists,
    smartPublish
}; 