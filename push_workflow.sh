#!/bin/bash

# Git Push Workflow Script
# 用法: ./push_workflow.sh "提交信息"

# 检查是否提供了提交信息
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供提交信息"
    echo "用法: ./push_workflow.sh \"提交信息\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "📁 添加所有更改..."
git add .

echo "📝 提交更改: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

echo "🚀 推送到远程仓库..."
git push

echo "✅ 完成!"
