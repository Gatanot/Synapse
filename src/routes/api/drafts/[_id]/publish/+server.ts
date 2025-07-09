// src/routes/api/drafts/[_id]/publish/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticleById, updateArticleById } from '$lib/server/db/articleCollection';
import type { RequestHandler } from './$types';

/**
 * 发布草稿（将草稿状态改为已发布）
 */
export const POST: RequestHandler = async ({ params, locals }) => {
    // 认证检查
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to publish drafts.');
    }

    const draftId = params._id;
    if (!draftId) {
        throw svelteKitError(400, 'Draft ID is required');
    }

    try {
        // 检查草稿是否存在且属于当前用户
        const { data: draft, error: fetchError } = await getArticleById(draftId);
        if (fetchError || !draft) {
            throw svelteKitError(404, 'Draft not found');
        }

        if (draft.authorId.toString() !== locals.user._id) {
            throw svelteKitError(403, 'You are not the author of this draft');
        }

        if (draft.status !== 'draft') {
            throw svelteKitError(400, 'This article is not a draft');
        }

        // 检查草稿是否完整（标题、摘要、内容都不能为空）
        if (!draft.title?.trim() || !draft.summary?.trim() || !draft.body?.trim()) {
            return json({ 
                success: false, 
                message: 'Draft is incomplete. Please ensure title, summary, and content are all provided.' 
            }, { status: 400 });
        }

        // 更新文章状态为已发布，并更新发布时间
        const { error: updateError } = await updateArticleById(draftId, {
            status: 'published',
            updatedAt: new Date()
        });

        if (updateError) {
            console.error('Error publishing draft:', updateError);
            throw svelteKitError(500, 'Failed to publish draft');
        }

        return json({
            success: true,
            message: 'Draft published successfully',
            articleId: draftId
        });

    } catch (err: unknown) {
        console.error('API Error publishing draft:', err);
        
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            throw err;
        }

        const errorMessage = (err instanceof Error) 
            ? err.message 
            : 'An unexpected error occurred while publishing draft.';
        throw svelteKitError(500, `Internal Server Error: ${errorMessage}`);
    }
};
