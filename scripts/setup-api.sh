#!/bin/bash

echo "🚀 评论API后端设置向导"
echo "======================="

echo ""
echo "1. 📦 安装依赖..."
npm install @supabase/supabase-js

echo ""
echo "2. 🔧 设置说明："
echo "   - 请访问 https://supabase.com 创建新项目"
echo "   - 在 SQL Editor 中执行 API_SETUP.md 中的建表语句"
echo "   - 复制项目URL和anon key"
echo "   - 在 Netlify 项目设置中添加环境变量："
echo "     SUPABASE_URL=your_supabase_url"
echo "     SUPABASE_ANON_KEY=your_supabase_key"

echo ""
echo "3. 🏗️ 本地开发："
echo "   npm install -g netlify-cli"
echo "   netlify login"
echo "   netlify link"
echo "   netlify dev"

echo ""
echo "4. 🌐 生产部署："
echo "   - 推送代码到 GitHub"
echo "   - Netlify 会自动部署"
echo "   - API 将可在 https://your-site.netlify.app/api/comment 访问"

echo ""
echo "✅ 设置完成！查看 API_SETUP.md 获取详细说明" 