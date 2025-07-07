import { searchArticles } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { SearchType } from '$lib/types/server';

/**
 * GET /api/search
 * 搜索文章的API端点
 */
export const GET = async ({ url }: RequestEvent) => {
    const searchTerm = url.searchParams.get('q');
    const limitParam = url.searchParams.get('limit');
    const skipParam = url.searchParams.get('skip');
    const searchType = (url.searchParams.get('type') as SearchType) || 'all';

    // 验证搜索关键词
    if (!searchTerm || searchTerm.trim().length === 0) {
        return json(
            { 
                error: 'Search term is required',
                articles: []
            },
            { status: 400 }
        );
    }

    // 解析分页参数
    const limit = limitParam ? parseInt(limitParam) : 20;
    const skip = skipParam ? parseInt(skipParam) : 0;

    try {
        const { data: articles, error } = await searchArticles(
            searchTerm.trim(),
            {
                limit: Math.min(limit, 50), // 限制最大返回数量
                skip: Math.max(skip, 0),
                status: 'published', // 只搜索已发布的文章
                includeBody: false, // 搜索结果不包含文章内容
                searchType
            }
        );

        if (error) {
            console.error('Search error:', error);
            return json(
                {
                    error: 'Search failed. Please try again.',
                    articles: []
                },
                { status: 500 }
            );
        }

        return json({
            articles: articles || [],
            searchTerm: searchTerm.trim(),
            searchType,
            total: articles?.length || 0
        });

    } catch (err) {
        console.error('Unexpected error during search:', err);
        return json(
            {
                error: 'An unexpected error occurred during search.',
                articles: []
            },
            { status: 500 }
        );
    }
};
