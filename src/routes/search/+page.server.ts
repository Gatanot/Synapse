import { searchArticles } from '$lib/server/db';
import type { ServerLoad } from '@sveltejs/kit';

/**
 * 搜索页面的服务端数据加载
 */
export const load: ServerLoad = async ({ url }) => {
    const searchTerm = url.searchParams.get('q');

    // 如果没有搜索关键词，返回空结果
    if (!searchTerm || searchTerm.trim().length === 0) {
        return {
            articles: [],
            searchTerm: '',
            hasSearched: false
        };
    }

    try {
        const { data: articles, error } = await searchArticles(
            searchTerm.trim(),
            {
                limit: 20,
                skip: 0,
                status: 'published',
                includeBody: false
            }
        );

        if (error) {
            console.error('Search error in page load:', error);
            return {
                articles: [],
                searchTerm: searchTerm.trim(),
                hasSearched: true,
                error: 'Search failed. Please try again.'
            };
        }

        return {
            articles: articles || [],
            searchTerm: searchTerm.trim(),
            hasSearched: true
        };

    } catch (err) {
        console.error('Unexpected error during search page load:', err);
        return {
            articles: [],
            searchTerm: searchTerm.trim(),
            hasSearched: true,
            error: 'An unexpected error occurred during search.'
        };
    }
};
