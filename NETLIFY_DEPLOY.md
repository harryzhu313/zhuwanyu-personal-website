# 通过 Netlify 部署指南

## 方法一：连接 GitHub 仓库（推荐）

### 1. 准备代码仓库
1. 确保您的代码已推送到 GitHub 仓库
2. 确保仓库中包含 `netlify.toml` 配置文件

### 2. 在 Netlify 中设置
1. 访问 [netlify.com](https://netlify.com) 并登录
2. 点击 "New site from Git"
3. 选择 "GitHub" 并授权 Netlify 访问您的仓库
4. 选择您的个人网站仓库
5. 配置构建设置：
   - **Build command**: `npm run fresh-build`
   - **Publish directory**: `dist`
   - **Base directory**: 留空

### 3. 环境变量设置
如果您的网站使用了 Notion API，需要在 Netlify 中设置环境变量：
1. 在 Netlify 项目设置中找到 "Environment variables"
2. 添加必要的环境变量（如 `NOTION_TOKEN`）

### 4. 部署
1. 点击 "Deploy site"
2. Netlify 将自动构建并部署您的网站
3. 构建完成后，您将获得一个临时域名

## 方法二：手动部署

### 1. 本地构建
```bash
# 在项目根目录执行
npm run fresh-build
```

### 2. 上传到 Netlify
1. 访问 [netlify.com](https://netlify.com) 并登录
2. 将 `dist` 文件夹拖拽到 Netlify 的部署区域
3. 等待部署完成

## 自定义域名

### 1. 在 Netlify 中配置
1. 进入您的 Netlify 项目设置
2. 点击 "Domain management"
3. 点击 "Add custom domain"
4. 输入您的域名（如 `www.zhuwanyu.com`）

### 2. 配置 DNS
在您的域名提供商处，将 DNS 记录指向 Netlify：

**方法 A：使用 Netlify DNS（推荐）**
- 将域名的 nameservers 更改为 Netlify 提供的

**方法 B：使用 CNAME 记录**
- 添加 CNAME 记录：`www` -> `your-site-name.netlify.app`

## 自动部署设置

连接 GitHub 后，每次推送代码到主分支，Netlify 将自动重新构建和部署网站。

## 构建优化

项目已配置以下优化：
- ✅ 静态资源缓存（CSS、JS、图片）
- ✅ Astro 静态构建
- ✅ 图片本地化处理
- ✅ 自定义构建脚本

## 常见问题

### 构建失败
1. 检查 Node.js 版本（建议 18+）
2. 确保所有依赖都在 `package.json` 中
3. 检查环境变量是否正确设置
4. **配置冲突**：如果看到 "Failed to build site" 但构建日志显示成功，可能是 Astro 配置问题
   - 确保 `astro.config.ts` 中没有同时使用 `output: "static"` 和 `adapter: netlify()`
   - 对于静态站点，不需要 Netlify 适配器

### 图片不显示
1. 确保图片路径正确
2. 检查 Notion 图片权限（如果使用 Notion API）
3. 运行 `npm run fresh-build` 重新下载图片

### 域名访问问题
1. 等待 DNS 传播（可能需要 24-48 小时）
2. 检查 DNS 记录是否正确配置
3. 确保启用了 HTTPS（Netlify 自动提供） 