#!/usr/bin/env node

console.log('🧪 评论API测试工具');
console.log('==================');

const baseURL = 'http://localhost:8888/.netlify/functions/comment-test';

async function testAPI() {
  try {
    console.log('\n1. 测试获取评论...');
    const getResponse = await fetch(baseURL);
    
    if (!getResponse.ok) {
      throw new Error(`GET请求失败: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const comments = await getResponse.json();
    console.log('✅ GET请求成功');
    console.log('现有评论数量:', comments.length);
    console.log('评论列表:', JSON.stringify(comments, null, 2));

    console.log('\n2. 测试提交评论...');
    const testComment = {
      name: '测试机器人',
      email: 'test@example.com',
      content: '这是一条自动测试评论 - ' + new Date().toISOString(),
      collection: 'articles',
      entry: 'test-article'
    };

    const putResponse = await fetch(baseURL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testComment)
    });

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      throw new Error(`PUT请求失败: ${putResponse.status} ${putResponse.statusText}\n${errorText}`);
    }

    const newComment = await putResponse.json();
    console.log('✅ PUT请求成功');
    console.log('新评论:', JSON.stringify(newComment, null, 2));

    console.log('\n3. 再次获取评论验证...');
    const finalResponse = await fetch(baseURL);
    const finalComments = await finalResponse.json();
    console.log('✅ 验证成功');
    console.log('最终评论数量:', finalComments.length);

    console.log('\n🎉 所有测试通过！评论API工作正常。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n排查建议:');
    console.error('1. 确保 Netlify Dev 正在运行: npm run dev:netlify');
    console.error('2. 检查函数是否正确部署在 netlify/functions/ 目录');
    console.error('3. 查看终端中的错误日志');
    process.exit(1);
  }
}

// 检查是否在运行Netlify Dev
async function checkNetlifyDev() {
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/comment-test', {
      method: 'OPTIONS'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  const isNetlifyRunning = await checkNetlifyDev();
  
  if (!isNetlifyRunning) {
    console.log('❌ Netlify Dev 未运行');
    console.log('\n请先启动本地开发服务器:');
    console.log('npm run dev:netlify');
    process.exit(1);
  }

  console.log('✅ Netlify Dev 正在运行');
  await testAPI();
}

main(); 