#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 检查评论API配置...');

// 检查必要文件是否存在
const requiredFiles = [
  'netlify/functions/comment.js',
  'netlify.toml'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = join(__dirname, '..', file);
  if (!existsSync(fullPath)) {
    console.log(`❌ 缺少文件: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ 文件存在: ${file}`);
  }
}

// 检查netlify.toml配置
const netlifyConfigPath = join(__dirname, '..', 'netlify.toml');
if (existsSync(netlifyConfigPath)) {
  const netlifyConfig = readFileSync(netlifyConfigPath, 'utf-8');
  
  if (netlifyConfig.includes('functions = "netlify/functions"')) {
    console.log('✅ Netlify Functions 配置正确');
  } else {
    console.log('❌ Netlify Functions 配置缺失');
    allFilesExist = false;
  }
  
  if (netlifyConfig.includes('from = "/api/*"')) {
    console.log('✅ API 重定向配置正确');
  } else {
    console.log('❌ API 重定向配置缺失');
    allFilesExist = false;
  }
} else {
  console.log('❌ netlify.toml 文件不存在');
  allFilesExist = false;
}

// 检查package.json依赖
const packageJsonPath = join(__dirname, '..', 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  if (packageJson.dependencies['@supabase/supabase-js']) {
    console.log('✅ Supabase 依赖已安装');
  } else {
    console.log('❌ 缺少 @supabase/supabase-js 依赖');
    allFilesExist = false;
  }
}

console.log('');

if (allFilesExist) {
  console.log('🎉 API配置完整！');
  console.log('');
  console.log('📋 下一步：');
  console.log('1. 在 Supabase 创建项目和数据表');
  console.log('2. 在 Netlify 设置环境变量：');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_ANON_KEY');
  console.log('3. 推送代码到 GitHub，Netlify 自动部署');
  console.log('');
  console.log('💻 本地开发：npm run dev:netlify');
} else {
  console.log('⚠️  配置不完整，请运行：npm run setup-api');
}

process.exit(allFilesExist ? 0 : 1); 