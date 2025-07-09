import { searchArticles } from '$lib/server/db';
import type { ServerLoad } from '@sveltejs/kit';
import type { SearchType } from '$lib/types/server';

/**
 * 搜索页面的服务端数据加载
 */
export const load: ServerLoad = async ({ url }) => {
    const searchTerm = url.searchParams.get('q');
    const searchType = (url.searchParams.get('type') as SearchType) || 'all';
    const pageParam = url.searchParams.get('page');
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : 1;
    const limit = 10; // 每页显示10条结果
    const skip = (page - 1) * limit;

    // 如果没有搜索关键词，返回空结果
    if (!searchTerm || searchTerm.trim().length === 0) {
        return {
            articles: [],
            searchTerm: '',
            searchType: 'all',
            hasSearched: false,
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalResults: 0,
                limit: limit
            }
        };
    }

    try {
        const searchResult = await searchArticles(
            searchTerm.trim(),
            {
                limit: limit + 1, // 获取多一条来判断是否还有更多结果
                skip,
                status: 'published',
                includeBody: false,
                searchType
            }
        );

        if (searchResult.error) {
            console.error('Search error in page load:', searchResult.error);
            return {
                articles: [],
                searchTerm: searchTerm.trim(),
                searchType,
                hasSearched: true,
                error: 'Search failed. Please try again.',
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalResults: 0,
                    limit: limit
                }
            };
        }

        const allArticles = searchResult.data || [];
        const hasMoreResults = allArticles.length > limit;
        const displayArticles = hasMoreResults ? allArticles.slice(0, limit) : allArticles;
        
        // 计算分页信息
        const totalResults = skip + allArticles.length + (hasMoreResults ? 1 : 0); // 估算总数
        const totalPages = Math.max(1, Math.ceil(totalResults / limit)); // 确保至少有1页

        // 提取模糊搜索信息
        const fuzzySearchInfo = (searchResult as any).fuzzySearchInfo;

        return {
            articles: displayArticles,
            searchTerm: searchTerm.trim(),
            searchType,
            hasSearched: true,
            fuzzySearchInfo, // 传递模糊搜索信息
            pagination: {
                currentPage: page,
                totalPages: Math.max(totalPages, page + (hasMoreResults ? 1 : 0)),
                totalResults: totalResults,
                limit: limit,
                hasMoreResults
            }
        };

    } catch (err) {
        console.error('Unexpected error during search page load:', err);
        return {
            articles: [],
            searchTerm: searchTerm.trim(),
            searchType,
            hasSearched: true,
            error: 'An unexpected error occurred during search.',
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalResults: 0,
                limit: limit
            }
        };
    }
};
