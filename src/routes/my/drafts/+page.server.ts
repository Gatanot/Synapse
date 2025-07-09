// src/routes/my/drafts/+page.server.ts
import type { PageServerLoad } from './$types';
import { getArticlesByUserId } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  // 需要用户已登录
  if (!locals.user) {
    return { drafts: [] };
  }
  
  const userId = locals.user._id;
  // 获取用户的草稿文章
  const { data: drafts, error } = await getArticlesByUserId(userId, { 
    status: 'draft',
    includeBody: false 
  });
  
  if (error) {
    // 可以根据需要处理错误
    console.error('Error loading drafts:', error);
    return { drafts: [] };
  }
  
  return { 
    drafts: drafts || [] 
  };
};
