# Harry的个人网站

- 主站：www.zhuwanyu.com
- 网站代码来源：https://github.com/tansongchen/tansongchen.github.io

## 开发与构建

### 本地开发
`npm run dev`

### 清理缓存+构建
`npm run fresh-build`

### 预览
`npm run preview`

## 部署

### Netlify 部署
详细部署指南请参考：[NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)

快速部署步骤：
1. 推送代码到 GitHub
2. 在 Netlify 连接仓库
3. 设置构建命令：`npm run fresh-build`
4. 设置发布目录：`dist`
5. 部署完成！