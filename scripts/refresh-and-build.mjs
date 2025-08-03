#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔄 开始刷新并构建流程...');

// 检查是否在 Netlify 构建环境
const isNetlify = process.env.NETLIFY === 'true';
console.log(isNetlify ? '🏗️ Netlify 构建环境检测到' : '🏠 本地构建环境');

try {
  // 1. 清理缓存，强制重新获取 Notion 数据
  console.log('📁 清理缓存...');
  await execAsync('rm -rf node_modules/.astro .astro dist');
  
  // 2. 重新安装依赖（确保环境干净）
  console.log('📦 重新安装依赖...');
  await execAsync('npm install');
  
  // 3. 在 Netlify 环境中设置更短的超时时间
  if (isNetlify) {
    console.log('⚡ Netlify 环境：设置较短的网络超时时间');
    process.env.ASTRO_BUILD_TIMEOUT = '30000'; // 30秒超时
  }
  
  // 4. 构建项目（此时会重新从 Notion 获取新鲜数据）
  console.log('🏗️ 开始构建...');
  await execAsync('npm run build');
  
  console.log('✅ 构建成功！图片已本地化到 dist/_astro/');
  console.log('');
  console.log('🎉 构建完成！接下来可以：');
  console.log('   • 运行 npm run preview 启动预览服务器');
  console.log('   • 部署 dist/ 文件夹到生产环境');
  console.log('   • 检查 dist/_astro/ 目录中的本地化图片');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  
  // 检查是否是网络相关问题
  if (error.message.includes('UND_ERR_CONNECT_TIMEOUT') || 
      error.message.includes('fetch failed') ||
      error.message.includes('timeout')) {
    console.log('');
    console.log('🌐 检测到网络超时问题！');
    
    if (isNetlify) {
      console.log('💡 Netlify 构建解决方案:');
      console.log('1. 检查 Notion 图片 URL 是否可访问');
      console.log('2. 考虑预先下载图片到仓库中');
      console.log('3. 或者暂时禁用有问题的照片集合');
      console.log('4. 检查 NOTION_TOKEN 环境变量是否正确设置');
    } else {
      console.log('💡 本地开发解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 检查 Notion 图片 URL 是否过期');
      console.log('3. 在 Notion 中重新编辑页面以刷新 URL');
      console.log('4. 确保 NOTION_TOKEN 环境变量正确');
    }
  } else {
    console.log('💡 通用解决方案:');
    console.log('1. 检查 Notion 图片 URL 是否过期');
    console.log('2. 在 Notion 中重新编辑页面以刷新 URL');
    console.log('3. 确保 NOTION_TOKEN 环境变量正确');
  }
  
  process.exit(1);
} 