// src/routes/+page.server.ts

import type { PageServerLoad } from './$types';
import { getLatestArticles } from '$lib/server/db/articleCollection';
// redirect 暂时没有使用，可以先注释或移除
// import { redirect } from '@sveltejs/kit';

/**
 * 为主页加载数据。
 * 这会获取最新的已发布文章列表，并传递当前登录的用户信息。
 */
export const load: PageServerLoad = async ({ locals }) => {
    try {
        // 调用我们已经类型化的 getLatestArticles 函数
        const { data: articles, error } = await getLatestArticles({
            limit: 10,
            status: 'published',
            includeBody: false
        });

        if (error) {
            console.warn(`Failed to fetch latest articles: ${error.message}`);
            // 即使出错，也返回一个确定的结构，SvelteKit 会处理 PageData
            return {
                articles: [],
                user: locals.user // locals.user 已经是类型安全的
            };
        }

        // 如果 articles 为 null（尽管在我们的实现中不太可能），提供一个空数组作为后备
        return {
            articles: articles || [],
            user: locals.user
        };
    } catch (err: any) {
        console.error('Error in homepage load function:', err);
        // 在发生不可预见的异常时，返回一个带有错误信息的状态
        return {
            articles: [],
            error: 'Failed to load articles. Please try again later.',
            user: locals.user
        };
    }
};