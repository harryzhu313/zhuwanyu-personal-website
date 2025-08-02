#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('🔍 验证生产环境配置');
console.log('===================');

// 检查是否已切换到生产API
const commenterContent = readFileSync('src/islands/Commenter.tsx', 'utf-8');
const indexContent = readFileSync('src/index.ts', 'utf-8');

let allGood = true;

console.log('\n📋 配置检查：');

// 检查是否移除了测试端点
if (indexContent.includes('testEndpoint')) {
  console.log('❌ src/index.ts 仍包含测试端点');
  allGood = false;
} else {
  console.log('✅ 已移除测试端点');
}

// 检查是否使用正常API调用
if (commenterContent.includes('testEndpoint')) {
  console.log('❌ Commenter组件仍使用测试端点');
  allGood = false;
} else {
  console.log('✅ Commenter组件使用正常API');
}

// 检查是否使用put和get函数
if (commenterContent.includes('put("/comment"') && commenterContent.includes('get<Comment[]>')) {
  console.log('✅ 使用正确的API调用方式');
} else {
  console.log('❌ API调用方式不正确');
  allGood = false;
}

console.log('\n🗄️ 数据库配置检查：');
console.log('请确保在 Netlify 项目设置中已添加：');
console.log('  SUPABASE_URL=your_supabase_url');
console.log('  SUPABASE_ANON_KEY=your_supabase_key');

console.log('\n📊 预期结果：');
console.log('✅ 评论数据将永久保存在 Supabase 数据库');
console.log('✅ 服务器重启不会丢失评论');
console.log('✅ 重新部署不会影响现有评论');

if (allGood) {
  console.log('\n🎉 配置验证通过！可以部署了');
  console.log('\n部署命令：');
  console.log('git add .');
  console.log('git commit -m "切换到Supabase生产环境"');
  console.log('git push');
} else {
  console.log('\n⚠️  发现配置问题，请检查上述错误');
}

console.log('\n📝 部署后测试：');
console.log('1. 访问你的网站');
console.log('2. 提交一条测试评论');
console.log('3. 重新部署网站');
console.log('4. 检查评论是否仍然存在');

process.exit(allGood ? 0 : 1); 