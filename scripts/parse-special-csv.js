const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

/**
 * 解析特殊格式的CSV文件
 * 处理包含多行文本的字段
 */
async function parseSpecialCSV(filePath) {
    console.log(`\n📋 解析CSV文件: ${path.basename(filePath)}`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 使用csv-parse的宽松模式
    const records = [];

    return new Promise((resolve, reject) => {
        parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            relax_quotes: true,
            relax_column_count: true,
            trim: true,
            cast: (value, context) => {
                // 处理多行文本
                return value ? value.trim() : '';
            }
        })
            .on('readable', function () {
                let record;
                while ((record = this.read()) !== null) {
                    records.push(record);
                }
            })
            .on('error', function (err) {
                console.error('❌ 解析错误:', err.message);
                reject(err);
            })
            .on('end', function () {
                console.log(`✅ 解析完成，共找到 ${records.length} 条记录`);

                // 显示解析结果
                records.forEach((record, index) => {
                    console.log(`\n📝 记录 ${index + 1}:`);
                    console.log(`   主题: ${record['主题'] || '(空)'}`);
                    console.log(`   发布: ${record['发布'] || '(空)'}`);
                    console.log(`   提出人: ${record['提出人'] || '(空)'}`);
                    console.log(`   内容长度: ${(record['发布内容'] || '').length} 字符`);
                    console.log(`   发布完成: ${record['发布完成'] || '(空)'}`);
                });

                resolve(records);
            });
    });
}

// 验证记录是否有效
function validateRecord(record) {
    // 必须有主题
    if (!record['主题'] || record['主题'].trim() === '') {
        return false;
    }
    return true;
}

// 主函数
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('用法: node parse-special-csv.js <CSV文件>');
        console.log('示例: node parse-special-csv.js 内容库_发布数据@zc_发布情况.csv');
        process.exit(1);
    }

    const filePath = args[0];

    try {
        const records = await parseSpecialCSV(filePath);

        // 过滤有效记录
        const validRecords = records.filter(validateRecord);
        console.log(`\n✅ 有效记录数: ${validRecords.length}`);

        // 统计发布状态
        const publishedCount = validRecords.filter(r =>
            r['发布完成'] === '是' || r['发布完成'] === 'true'
        ).length;

        console.log(`📊 统计信息:`);
        console.log(`   总记录数: ${records.length}`);
        console.log(`   有效记录数: ${validRecords.length}`);
        console.log(`   已发布: ${publishedCount}`);
        console.log(`   待发布: ${validRecords.length - publishedCount}`);

    } catch (error) {
        console.error('❌ 处理失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { parseSpecialCSV }; 