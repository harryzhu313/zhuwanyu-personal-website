#!/usr/bin/env node

/**
 * Supabase 保活脚本
 * 定期访问数据库以防止项目被暂停
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ 缺少 Supabase 环境变量');
  console.log('请在 .env 文件中设置:');
  console.log('SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_ANON_KEY=your_supabase_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  try {
    console.log('🔄 正在进行保活检查...');
    
    // 简单查询以保持连接活跃
    const { data, error } = await supabase
      .from('comments')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ 保活失败:', error.message);
    } else {
      console.log('✅ 保活成功! 数据库连接正常');
    }
  } catch (error) {
    console.error('❌ 保活过程出错:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  keepAlive();
}

export default keepAlive;
