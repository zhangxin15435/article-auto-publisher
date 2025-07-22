const TableParser = require('../src/utils/tableParser');

async function testCSVParse() {
    const parser = new TableParser();
    const filePath = '内容库_发布数据@zc_发布情况.csv';

    try {
        console.log('📋 开始解析CSV文件...');
        const articles = await parser.parseFile(filePath);
        console.log(`✅ 解析成功，找到 ${articles.length} 篇文章`);

        articles.forEach((article, index) => {
            console.log(`\n📝 文章 ${index + 1}:`);
            console.log(`   标题: ${article.title}`);
            console.log(`   作者: ${article.author || '(未指定)'}`);
            console.log(`   内容长度: ${(article.content || '').length} 字符`);
            console.log(`   发布状态: ${article.published ? '已发布' : '未发布'}`);
        });
    } catch (error) {
        console.error('❌ 解析失败:', error.message);
        console.error('错误详情:', error);
    }
}

testCSVParse(); 