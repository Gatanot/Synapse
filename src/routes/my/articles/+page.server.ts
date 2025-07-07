import type { PageServerLoad } from './$types';
import { getArticlesByUserId } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  // 需要用户已登录
  if (!locals.user) {
    return { articles: [] };
  }
  const userId = locals.user._id;
  const { data: articles, error } = await getArticlesByUserId(userId);
  if (error) {
    // 可以根据需要处理错误
    return { articles: [] };
  }
  return { articles };
};
