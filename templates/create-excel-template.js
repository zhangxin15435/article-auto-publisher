const XLSX = require('xlsx');
const path = require('path');

// 创建示例数据
const data = [
    {
        'title': 'JavaScript异步编程完全指南',
        'description': '深入理解JavaScript异步编程的发展历程',
        'tags': 'javascript,async,promise,webdev',
        'content': `# JavaScript异步编程完全指南

JavaScript异步编程是现代Web开发的核心技能之一。从最初的回调函数，到Promise，再到async/await，异步编程的写法越来越优雅和易读。

## 什么是异步编程？

异步编程是一种编程范式，允许程序在等待某些操作完成时继续执行其他代码...

## 总结

掌握异步编程是成为优秀JavaScript开发者的必经之路。`,
        'file_path': '',
        'cover_image': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb',
        'canonical_url': '',
        'series': 'JavaScript进阶系列',
        'published': true,
        'devto_published': false,
        'hashnode_published': false,
        'last_published': ''
    },
    {
        'title': 'React Hooks实战指南',
        'description': '详细解释React Hooks的使用方法和最佳实践',
        'tags': 'react,hooks,javascript,frontend',
        'content': '',
        'file_path': 'articles/react-hooks-guide.md',
        'cover_image': 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2',
        'canonical_url': 'https://myblog.com/react-hooks',
        'series': 'React实战系列',
        'published': true,
        'devto_published': false,
        'hashnode_published': false,
        'last_published': ''
    },
    {
        'title': 'TypeScript入门教程',
        'description': '从零开始学习TypeScript的基础语法和高级特性',
        'tags': 'typescript,javascript,tutorial,beginners',
        'content': `# TypeScript入门教程

TypeScript是JavaScript的超集，为JavaScript添加了静态类型检查功能...

## 基础语法

### 变量声明
\`\`\`typescript
let message: string = 'Hello TypeScript';
let count: number = 42;
let isReady: boolean = true;
\`\`\`

## 总结

TypeScript能够帮助我们编写更安全、更可维护的JavaScript代码。`,
        'file_path': '',
        'cover_image': '',
        'canonical_url': '',
        'series': '编程语言系列',
        'published': true,
        'devto_published': false,
        'hashnode_published': false,
        'last_published': ''
    }
];

// 创建工作簿
const workbook = XLSX.utils.book_new();

// 创建工作表
const worksheet = XLSX.utils.json_to_sheet(data);

// 设置列宽
const colWidths = [
    { wch: 30 }, // title
    { wch: 40 }, // description
    { wch: 35 }, // tags
    { wch: 50 }, // content
    { wch: 30 }, // file_path
    { wch: 50 }, // cover_image
    { wch: 30 }, // canonical_url
    { wch: 20 }, // series
    { wch: 10 }, // published
    { wch: 15 }, // devto_published
    { wch: 18 }, // hashnode_published
    { wch: 15 }  // last_published
];

worksheet['!cols'] = colWidths;

// 添加工作表到工作簿
XLSX.utils.book_append_sheet(workbook, worksheet, 'Articles');

// 写入文件
const filePath = path.join(__dirname, 'articles-template.xlsx');
XLSX.writeFile(workbook, filePath);

console.log('Excel模板文件已创建:', filePath); 