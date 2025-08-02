#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';

console.log('🚀 部署前检查');
console.log('=============');

// 检查是否使用测试API
const commenterPath = 'src/islands/Commenter.tsx';
const commenterContent = readFileSync(commenterPath, 'utf-8');

if (commenterContent.includes('testEndpoint')) {
  console.log('⚠️  当前使用测试API（内存存储）');
  console.log('   评论数据不会持久化保存');
  console.log('   如需持久化存储，请先配置 Supabase');
  console.log('');
  console.log('是否继续部署测试版本？');
  console.log('✅ 优点：快速上线，功能可用');
  console.log('❌ 缺点：评论数据会丢失');
} else {
  console.log('✅ 使用生产API配置');
}

// 检查必要文件
const requiredFiles = [
  'netlify.toml',
  'netlify/functions/comment-test.js'
];

let allGood = true;
for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ 缺少文件: ${file}`);
    allGood = false;
  }
}

console.log('');
if (allGood) {
  console.log('🎯 准备就绪！可以部署了');
  console.log('');
  console.log('部署步骤：');
  console.log('1. git add .');
  console.log('2. git commit -m "添加评论系统"');
  console.log('3. git push');
  console.log('4. Netlify 自动部署');
} else {
  console.log('❌ 发现问题，请先修复');
} 