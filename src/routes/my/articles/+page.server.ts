import type { PageServerLoad } from './$types';
import { getArticlesByUserId } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  // 需要用户已登录
  if (!locals.user) {
    return { articles: [] };
  }
  const userId = locals.user._id;
  // 只获取已发布的文章
  const { data: articles, error } = await getArticlesByUserId(userId, { 
    status: 'published',
    includeBody: false 
  });
  if (error) {
    // 可以根据需要处理错误
    return { articles: [] };
  }
  return { articles };
};
