#!/usr/bin/env node

/**
 * Netlify 构建环境检查脚本
 * 在构建前验证环境变量和网络连接
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Netlify 构建环境检查...');

// 检查必要的环境变量
const requiredEnvVars = [
  'NOTION_TOKEN',
  'NOTION_PAGE_ID',
  'PHOTOS_DATABASE'
];

let missingVars = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}: 已设置`);
  }
}

if (missingVars.length > 0) {
  console.error('❌ 缺少以下环境变量:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('请在 Netlify 控制台中设置这些环境变量');
  process.exit(1);
}

// 检查网络连接（快速测试）
try {
  console.log('🌐 测试网络连接...');
  await execAsync('curl -s --max-time 5 https://api.notion.com > /dev/null');
  console.log('✅ Notion API 可访问');
} catch (error) {
  console.warn('⚠️ 网络连接测试失败，但继续构建');
  console.warn('如果构建失败，可能是网络超时导致的');
}

// 设置构建超时和并发限制
process.env.NOTION_REQUEST_TIMEOUT = '10000'; // 10秒
process.env.NOTION_MAX_CONCURRENT = '3'; // 最多3个并发请求

console.log('🚀 环境检查完成，开始构建...');
console.log(''); 