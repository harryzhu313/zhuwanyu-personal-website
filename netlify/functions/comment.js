// Netlify Functions 评论API
import { createClient } from '@supabase/supabase-js'

// 环境变量配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export async function handler(event, context) {
  // 设置CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  }

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getComments(headers)
      case 'PUT':
        return await addComment(event.body, headers)
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

async function getComments(headers) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('datetime', { ascending: false })

  if (error) {
    throw error
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data)
  }
}

async function addComment(body, headers) {
  const comment = JSON.parse(body)
  
  // 验证必填字段
  if (!comment.content) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Content is required' })
    }
  }

  // 添加服务器端时间戳和ID
  const commentData = {
    ...comment,
    id: Date.now(),
    datetime: new Date().toISOString(),
    // 简单的内容过滤
    content: comment.content.slice(0, 1000), // 限制长度
    name: (comment.name || '匿名用户').slice(0, 50),
    email: comment.email || null
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([commentData])
    .select()

  if (error) {
    throw error
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data[0])
  }
} 