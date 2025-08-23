// 基于文件存储的评论系统 - 适合低流量网站
// 使用 GitHub 仓库作为数据存储

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // GitHub Personal Access Token
});

const OWNER = 'your-github-username'; // 需要替换为您的GitHub用户名
const REPO = 'zhuwanyu-personal-site'; // 仓库名
const COMMENTS_FILE = 'data/comments.json';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getComments(headers);
      case 'PUT':
        return await addComment(event.body, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function getComments(headers) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: COMMENTS_FILE,
    });

    const content = Buffer.from(data.content, 'base64').toString();
    const comments = JSON.parse(content);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(comments)
    };
  } catch (error) {
    // 如果文件不存在，返回空数组
    if (error.status === 404) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }
    throw error;
  }
}

async function addComment(body, headers) {
  const newComment = JSON.parse(body);
  
  if (!newComment.content) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Content is required' })
    };
  }

  // 获取现有评论
  let comments = [];
  let sha = null;
  
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: COMMENTS_FILE,
    });
    
    const content = Buffer.from(data.content, 'base64').toString();
    comments = JSON.parse(content);
    sha = data.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
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

  // 更新文件
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: COMMENTS_FILE,
    message: `Add comment from ${comment.name}`,
    content: Buffer.from(JSON.stringify(comments, null, 2)).toString('base64'),
    sha: sha,
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(comment)
  };
}
