import type { PageServerLoad } from './$types';
import { getLatestArticles } from '$lib/server/db/articleCollection';

/**
 * 为主页加载其独有的数据。
 */
export const load: PageServerLoad = async () => {
    try {
        const { data: articles, error } = await getLatestArticles({
            // 移除 limit 限制，获取所有已发布的文章
            status: 'published',
            includeBody: false
        });

        if (error) {
            console.warn(`Failed to fetch latest articles: ${error.message}`);
            return {
                articles: [],
                error: null
            };
        }

        return {
            articles: articles ?? [],
            error: null
        };
    } catch (err: unknown) {
        console.error('Error in homepage load function:', err);
        return {
            articles: [],
            error: 'Failed to load articles. Please try again later.'
        };
    }
};