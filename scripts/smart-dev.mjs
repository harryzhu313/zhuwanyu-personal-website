#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 智能开发模式启动器');
console.log('========================');
console.log('');
console.log('选择开发模式：');
console.log('1. 仅前端开发 (astro dev) - 快速启动，无API功能');
console.log('2. 完整开发 (netlify dev) - 包含评论API，启动较慢');
console.log('');

// 检查是否安装了netlify-cli
function checkNetlifyCLI() {
  try {
    spawn('netlify', ['--version'], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 读取用户输入
function getUserChoice() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      const choice = key.toString();
      if (choice === '1' || choice === '2') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(choice);
      } else if (choice === '\u0003') { // Ctrl+C
        console.log('\n退出');
        process.exit(0);
      }
    });
  });
}

async function main() {
  // 如果没有安装netlify-cli，自动选择前端模式
  if (!checkNetlifyCLI()) {
    console.log('⚠️  未检测到 Netlify CLI，自动使用前端开发模式');
    console.log('如需完整功能，请运行: npm install -g netlify-cli');
    console.log('');
    console.log('启动前端开发服务器...');
    spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    return;
  }

  console.log('请选择 (1 或 2): ');
  const choice = await getUserChoice();

  console.log('');
  
  if (choice === '1') {
    console.log('🎯 启动前端开发模式...');
    console.log('访问: http://localhost:4321');
    spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  } else if (choice === '2') {
    console.log('🎯 启动完整开发模式...');
    console.log('访问: http://localhost:8888');
    spawn('npm', ['run', 'dev:netlify'], { stdio: 'inherit' });
  }
}

main(); 