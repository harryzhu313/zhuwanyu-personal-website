# 评论API后端设置指南

## 方案一：Netlify Functions + Supabase（推荐）

### 1. Supabase 设置

#### 1.1 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com) 并注册账号
2. 点击 "New Project" 创建新项目
3. 选择地区（建议选择离用户最近的地区）
4. 设置数据库密码并创建项目

#### 1.2 创建评论表
在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 创建评论表
CREATE TABLE comments (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50) DEFAULT '匿名用户',
  email VARCHAR(255),
  content TEXT NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  collection VARCHAR(50) NOT NULL,
  entry VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_comments_collection_entry ON comments(collection, entry);
CREATE INDEX idx_comments_datetime ON comments(datetime DESC);

-- 启用行级安全 (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取评论
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);

-- 创建策略：允许所有人插入评论（实际项目中可能需要更严格的限制）
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);
```

#### 1.3 获取项目凭据
1. 在 Supabase 项目设置中找到 "API" 页面
2. 复制 "Project URL" 和 "anon public" key

### 2. Netlify 环境变量设置

在 Netlify 项目设置中添加以下环境变量：

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 更新前端配置

修改 `src/index.ts` 中的 API 端点：

```typescript
// 将原来的
export const endpoint = "https://api.zhuwanyu.com";

// 改为
export const endpoint = process.env.NODE_ENV === 'production' 
  ? "https://your-site.netlify.app/api"  // 替换为你的Netlify域名
  : "http://localhost:8888/api";
```

### 4. 本地开发

#### 4.1 安装 Netlify CLI
```bash
npm install -g netlify-cli
```

#### 4.2 本地运行
```bash
# 登录 Netlify
netlify login

# 链接项目
netlify link

# 设置本地环境变量
echo "SUPABASE_URL=your_supabase_url" > .env
echo "SUPABASE_ANON_KEY=your_supabase_key" >> .env

# 本地开发（同时启动前端和 Functions）
netlify dev
```

### 5. 测试 API

#### 5.1 测试获取评论
```bash
curl "https://your-site.netlify.app/api/comment"
```

#### 5.2 测试提交评论
```bash
curl -X PUT "https://your-site.netlify.app/api/comment" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "email": "test@example.com",
    "content": "这是一条测试评论",
    "collection": "articles",
    "entry": "test-article"
  }'
```

## 方案二：Vercel Edge Functions

如果你想使用 Vercel 而不是 Netlify：

### 1. 迁移到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel

# 设置环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### 2. 创建 API 路由

创建文件 `api/comment.js`：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('datetime', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const comment = req.body
      
      if (!comment.content) {
        return res.status(400).json({ error: 'Content is required' })
      }

      const commentData = {
        ...comment,
        id: Date.now(),
        datetime: new Date().toISOString(),
        content: comment.content.slice(0, 1000),
        name: (comment.name || '匿名用户').slice(0, 50),
        email: comment.email || null
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select()

      if (error) throw error
      return res.status(200).json(data[0])
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

## 方案三：简单的云函数方案

如果你不想使用数据库，可以使用云存储（如 GitHub Gist 或简单的 JSON 文件）：

### 使用 GitHub API 存储评论

```javascript
// netlify/functions/comment-simple.js
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO // 格式: "username/repo"
const GIST_ID = process.env.GIST_ID

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  try {
    if (event.httpMethod === 'GET') {
      // 从 GitHub Gist 读取评论
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      const gist = await response.json()
      const comments = JSON.parse(gist.files['comments.json'].content || '[]')
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(comments)
      }
    }

    if (event.httpMethod === 'PUT') {
      const newComment = JSON.parse(event.body)
      
      // 获取现有评论
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
      
      const gist = await response.json()
      const comments = JSON.parse(gist.files['comments.json'].content || '[]')
      
      // 添加新评论
      const comment = {
        ...newComment,
        id: Date.now(),
        datetime: new Date().toISOString()
      }
      comments.push(comment)
      
      // 更新 Gist
      await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'comments.json': {
              content: JSON.stringify(comments, null, 2)
            }
          }
        })
      })
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(comment)
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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
```

## 部署步骤总结

1. **选择方案**：推荐方案一（Netlify Functions + Supabase）
2. **设置数据库**：在 Supabase 创建项目和表
3. **配置环境变量**：在 Netlify 项目设置中添加数据库凭据
4. **更新代码**：修改前端API端点配置
5. **部署测试**：推送代码到 GitHub，Netlify 自动部署

这样你就有了一个完整的评论系统后端，支持评论的提交和显示功能！ 