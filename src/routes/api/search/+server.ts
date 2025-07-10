import { json } from '@sveltejs/kit';
import { searchArticles } from '$lib/server/db/articleCollection';
import type { RequestHandler } from './$types';
import type { SearchType } from '$lib/types/server';

export const GET: RequestHandler = async ({ url }) => {
    const searchParams = url.searchParams;
    const query = searchParams.get('q');
    const searchType = (searchParams.get('type') || 'all') as SearchType;
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!query || query.trim() === '') {
        return json(
            {
                success: false,
                message: '搜索关键词不能为空'
            },
            { status: 400 }
        );
    }

    try {
        const { data: articles, error } = await searchArticles(query.trim(), {
            searchType,
            limit,
            skip,
            status: 'published',
            includeBody: false
        });

        if (error) {
            console.error('Search error:', error);
            return json(
                {
                    success: false,
                    message: '搜索时发生错误'
                },
                { status: 500 }
            );
        }

        return json({
            success: true,
            articles: articles || [],
            total: articles?.length || 0,
            query: query.trim(),
            searchType
        });
    } catch (err: unknown) {
        console.error('API Error during search:', err);
        const errorMessage =
            err instanceof Error
                ? err.message
                : 'An unexpected error occurred during search.';
        return json(
            {
                success: false,
                message: `搜索失败: ${errorMessage}`
            },
            { status: 500 }
        );
    }
};
