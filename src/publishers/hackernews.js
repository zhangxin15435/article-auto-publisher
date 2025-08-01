/**
 * Hacker News 发布器
 * 由于Hacker News没有官方API支持提交，这里提供几种替代方案
 */

/**
 * 模拟发布到 Hacker News（占位符实现）
 * 注意：Hacker News没有官方API，需要使用第三方工具或手动提交
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 发布结果
 */
async function publishToHackerNews(article, config, options = {}) {
  // 由于HN没有官方API，这里提供几种方案选择
  
  console.log('⚠️  Hacker News 没有官方发布API，建议使用以下方案之一：');
  console.log('1. 手动提交到 https://news.ycombinator.com/submit');
  console.log('2. 使用第三方调度工具（如 hn-schedule.rnikhil.com）');
  console.log('3. 使用浏览器自动化工具（需要额外配置）');
  
  // 生成提交链接，方便手动提交
  const submitUrl = generateHNSubmitUrl(article);
  
  return {
    success: false,
    platform: 'Hacker News',
    message: 'HN不支持API自动提交，请手动提交',
    submitUrl: submitUrl,
    data: {
      title: article.title,
      url: article.canonicalUrl || '#',
      text: article.description || article.content.substring(0, 200) + '...'
    }
  };
}

/**
 * 生成Hacker News提交链接
 * @param {object} article - 文章数据
 * @returns {string} 提交链接
 */
function generateHNSubmitUrl(article) {
  const baseUrl = 'https://news.ycombinator.com/submitlink';
  const params = new URLSearchParams({
    u: article.canonicalUrl || '',
    t: article.title || ''
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 使用浏览器自动化提交到Hacker News（需要安装puppeteer）
 * 这是一个高级功能，需要额外的依赖和配置
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息（包含用户名和密码）
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 发布结果
 */
async function submitWithAutomation(article, config, options = {}) {
  try {
    // 尝试导入puppeteer，如果没有安装则抛出错误
    const puppeteer = require('puppeteer');
    
    const browser = await puppeteer.launch({ 
      headless: !options.debug, // debug模式下显示浏览器
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
      // 1. 登录Hacker News
      await page.goto('https://news.ycombinator.com/login');
      await page.type('input[name="acct"]', config.username);
      await page.type('input[name="pw"]', config.password);
      await page.click('input[type="submit"]');
      
      // 等待登录完成
      await page.waitForNavigation();
      
      // 检查是否登录成功
      const loginError = await page.$('.pagetop font[color="red"]');
      if (loginError) {
        throw new Error('登录失败，请检查用户名和密码');
      }
      
      // 2. 前往提交页面
      await page.goto('https://news.ycombinator.com/submit');
      
      // 3. 填写提交表单
      await page.type('input[name="title"]', article.title);
      
      if (article.canonicalUrl) {
        // 提交链接
        await page.type('input[name="url"]', article.canonicalUrl);
      } else {
        // 提交文本
        await page.click('a[href="#"]'); // 切换到文本模式
        await page.type('textarea[name="text"]', article.content);
      }
      
      // 4. 提交表单
      await page.click('input[type="submit"]');
      await page.waitForNavigation();
      
      // 5. 检查提交结果
      const url = page.url();
      if (url.includes('/item?id=')) {
        const itemId = url.match(/id=(\d+)/)?.[1];
        await browser.close();
        
        return {
          success: true,
          id: itemId,
          url: url,
          platform: 'Hacker News',
          data: { itemId, url }
        };
      } else {
        throw new Error('提交可能失败，未获得预期的结果页面');
      }
      
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('浏览器自动化需要安装puppeteer: npm install puppeteer');
    }
    throw new Error(`自动提交失败: ${error.message}`);
  }
}

/**
 * 使用第三方调度服务（示例）
 * @param {object} article - 文章数据
 * @param {object} config - 配置信息
 * @param {object} options - 发布选项
 * @returns {Promise<object>} 调度结果
 */
async function scheduleSubmission(article, config, options = {}) {
  // 这里可以集成第三方调度服务
  // 例如：https://hn-schedule.rnikhil.com/
  
  const scheduleData = {
    title: article.title,
    url: article.canonicalUrl || '',
    scheduledTime: options.scheduleTime || new Date(Date.now() + 60000), // 默认1分钟后
    timezone: options.timezone || 'UTC'
  };
  
  console.log('📅 计划提交到Hacker News:');
  console.log(`   标题: ${scheduleData.title}`);
  console.log(`   链接: ${scheduleData.url}`);
  console.log(`   计划时间: ${scheduleData.scheduledTime}`);
  console.log('   请使用第三方调度工具完成实际提交');
  
  return {
    success: true,
    platform: 'Hacker News',
    scheduled: true,
    data: scheduleData,
    message: '已生成调度信息，需要使用第三方工具完成提交'
  };
}

/**
 * 获取最佳提交时间建议
 * @returns {object} 时间建议
 */
function getBestSubmissionTimes() {
  return {
    optimal: [
      '周一至周五 9:00-11:00 EST (美国东部时间)',
      '周一至周五 14:00-16:00 EST',
      '周二和周三通常效果最好'
    ],
    avoid: [
      '周末',
      '美国节假日',
      '深夜时段（EST 22:00-06:00）'
    ],
    tips: [
      '标题要吸引人但不要clickbait',
      '确保内容质量高，HN用户对质量要求很高',
      '技术类文章在HN表现通常更好',
      '考虑在产品发布或重大更新时提交'
    ]
  };
}

/**
 * 验证文章是否适合在Hacker News提交
 * @param {object} article - 文章数据
 * @returns {object} 验证结果
 */
function validateForHN(article) {
  const issues = [];
  const suggestions = [];
  
  // 检查标题
  if (!article.title) {
    issues.push('缺少标题');
  } else if (article.title.length > 80) {
    suggestions.push('标题可能过长，建议控制在80字符以内');
  }
  
  // 检查内容类型
  if (!article.canonicalUrl && (!article.content || article.content.length < 100)) {
    issues.push('缺少有效的URL或内容过短');
  }
  
  // 检查标签/类别
  const techTags = ['tech', 'programming', 'startup', 'science', 'technology'];
  const articleTags = article.tags || [];
  const hasTechTag = techTags.some(tag => 
    articleTags.some(articleTag => articleTag.toLowerCase().includes(tag))
  );
  
  if (!hasTechTag) {
    suggestions.push('HN偏向技术内容，考虑突出技术相关方面');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions,
    score: Math.max(0, 100 - issues.length * 30 - suggestions.length * 10)
  };
}

module.exports = {
  publishToHackerNews,
  submitWithAutomation,
  scheduleSubmission,
  generateHNSubmitUrl,
  getBestSubmissionTimes,
  validateForHN
}; 