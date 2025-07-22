const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

/**
 * 修复CSV文件中的多行文本格式问题
 */
async function fixCSVFormat(inputFile, outputFile) {
    console.log(`📋 修复CSV文件格式: ${inputFile}`);

    const results = [];
    let headers = null;
    let currentRow = null;
    let isInMultilineField = false;

    // 读取原始文件内容
    const content = fs.readFileSync(inputFile, 'utf-8');
    const lines = content.split('\n');

    // 提取标题行
    if (lines.length > 0) {
        headers = lines[0].split(',').map(h => h.trim());
        console.log(`✅ 找到列标题: ${headers.join(', ')}`);
    }

    // 手动解析CSV，处理多行文本
    let currentRecord = {};
    let fieldIndex = 0;
    let inQuotes = false;
    let currentField = '';

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // 检查是否是新记录的开始
        if (!inQuotes && line.split(',').length >= headers.length && line.trim() !== '') {
            // 保存之前的记录
            if (Object.keys(currentRecord).length > 0) {
                results.push(currentRecord);
            }

            // 开始新记录
            currentRecord = {};
            fieldIndex = 0;
            currentField = '';

            // 解析当前行
            for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    // 字段结束
                    if (fieldIndex < headers.length) {
                        currentRecord[headers[fieldIndex]] = currentField.trim();
                    }
                    fieldIndex++;
                    currentField = '';
                } else {
                    currentField += char;
                }
            }

            // 处理最后一个字段
            if (fieldIndex < headers.length) {
                currentRecord[headers[fieldIndex]] = currentField.trim();
            }
        } else if (inQuotes || line.trim() !== '') {
            // 继续当前字段（多行文本）
            currentField += '\n' + line;
        }
    }

    // 保存最后一条记录
    if (Object.keys(currentRecord).length > 0) {
        results.push(currentRecord);
    }

    console.log(`✅ 解析完成，共找到 ${results.length} 条记录`);

    // 写入修复后的CSV文件
    const output = fs.createWriteStream(outputFile);
    const stringifier = stringify({
        header: true,
        columns: headers,
        quoted: true, // 所有字段都加引号
        quoted_string: true
    });

    stringifier.pipe(output);

    results.forEach(record => {
        stringifier.write(record);
    });

    stringifier.end();

    return new Promise((resolve, reject) => {
        output.on('finish', () => {
            console.log(`✅ 修复后的文件已保存到: ${outputFile}`);
            resolve(results.length);
        });
        output.on('error', reject);
    });
}

// 主函数
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('用法: node fix-csv-format.js <输入文件> [输出文件]');
        console.log('示例: node fix-csv-format.js 内容库_发布数据@zc_发布情况.csv fixed-content.csv');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.csv', '-fixed.csv');

    try {
        await fixCSVFormat(inputFile, outputFile);
        console.log('\n🎉 CSV格式修复完成！');
        console.log('💡 下一步：使用修复后的文件进行表格发布');
        console.log(`   node table-publisher.js "${outputFile}" --draft`);
    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { fixCSVFormat }; 