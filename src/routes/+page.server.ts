import type { PageServerLoad } from './$types';
import { getLatestArticles } from '$lib/server/db/articleCollection';

/**
 * 为主页加载其独有的数据。
 */
export const load: PageServerLoad = async () => { // 不再需要 locals
    try {
        const { data: articles, error } = await getLatestArticles({
            limit: 10,
            status: 'published',
            includeBody: false
        });

        if (error) {
            console.warn(`Failed to fetch latest articles: ${error.message}`);
            return { articles: [] };
        }

        return { articles: articles || [] };
    } catch (err: any) {
        console.error('Error in homepage load function:', err);
        return {
            articles: [],
            error: 'Failed to load articles. Please try again later.'
        };
    }
};