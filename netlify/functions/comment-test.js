// 🧪 临时测试版评论API - 使用内存存储
// ⚠️  注意：此版本评论数据不会持久化保存
// 🔄 生产版本请配置 Supabase 数据库（参考 API_SETUP.md）

let comments = [
  {
    id: 1,
    name: "系统",
    email: "system@zhuwanyu.com",
    content: "🎉 评论系统已上线！这是一个测试版本，评论数据暂时存储在内存中。",
    datetime: "2024-01-15T10:00:00.000Z",
    collection: "articles",
    entry: "welcome"
  }
];

export async function handler(event, context) {
  // 设置CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  };

  console.log('API调用:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        console.log('获取评论，当前评论数量:', comments.length);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(comments)
        };

      case 'PUT':
        console.log('提交评论，请求体:', event.body);
        const newComment = JSON.parse(event.body);
        
        // 验证必填字段
        if (!newComment.content) {
          console.log('错误: 缺少评论内容');
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Content is required' })
          };
        }

        // 添加新评论
        const comment = {
          ...newComment,
          id: Date.now(),
          datetime: new Date().toISOString(),
          content: newComment.content.slice(0, 1000),
          name: (newComment.name || '匿名用户').slice(0, 50),
          email: newComment.email || null
        };

        comments.push(comment);
        console.log('评论添加成功:', comment);
        console.log('当前评论总数:', comments.length);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(comment)
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('API错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
} 