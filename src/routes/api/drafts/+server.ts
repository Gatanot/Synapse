// src/routes/api/drafts/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticlesByUserId } from '$lib/server/db/articleCollection';
import type { RequestHandler } from './$types';

/**
 * 获取用户的所有草稿
 */
export const GET: RequestHandler = async ({ locals }) => {
    // 认证检查
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to view drafts.');
    }

    try {
        // 获取用户的草稿文章 (status = 'draft')
        const { data: drafts, error } = await getArticlesByUserId(
            locals.user._id, 
            { 
                includeBody: false,  // 列表页不需要文章内容
                status: 'draft'      // 只获取草稿
            }
        );

        if (error) {
            console.error('Error fetching user drafts:', error);
            throw svelteKitError(500, 'Failed to fetch drafts');
        }

        return json({
            success: true,
            drafts: drafts || []
        });

    } catch (err: unknown) {
        console.error('API Error fetching drafts:', err);
        
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            throw err;
        }

        const errorMessage = (err instanceof Error) 
            ? err.message 
            : 'An unexpected error occurred while fetching drafts.';
        throw svelteKitError(500, `Internal Server Error: ${errorMessage}`);
    }
};
