# Harry的个人网站

- 主站：www.zhuwanyu.com
- 网站代码来源：https://github.com/tansongchen/tansongchen.github.io

## 开发与构建

### 本地开发

#### 智能启动（推荐）
```bash
npm run start-dev
# 会提示你选择开发模式
```

#### 手动选择模式
```bash
# 仅前端开发（快速启动，无评论功能）
npm run dev
# 访问: http://localhost:4321

# 完整开发（包含评论API，需要Netlify CLI）
npm run dev:netlify  
# 访问: http://localhost:8888
```

#### 什么时候用哪个模式？
- **仅前端开发** (`npm run dev`)：修改样式、布局、非评论相关功能
- **完整开发** (`npm run dev:netlify`)：测试评论功能、API相关开发

### 清理缓存+构建
`npm run fresh-build`

### 预览
`npm run preview`

## 评论API设置

### 首次设置（仅需一次）
```bash
# 1. 运行设置向导
npm run setup-api

# 2. 按照提示完成 Supabase 配置
# 3. 在 Netlify 设置环境变量
# 4. 推送代码，自动部署
```

### 检查配置
```bash
npm run check-api
```

## 部署

### Netlify 部署
详细部署指南请参考：[NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)

快速部署步骤：
1. 推送代码到 GitHub
2. 在 Netlify 连接仓库
3. 设置构建命令：`npm run fresh-build`
4. 设置发布目录：`dist`
5. 部署完成！