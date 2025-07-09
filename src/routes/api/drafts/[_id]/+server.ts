// src/routes/api/drafts/[_id]/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticleById, updateArticleById, deleteArticleById } from '$lib/server/db/articleCollection';
import type { RequestHandler } from './$types';
import type { ArticleClientInput } from '$lib/types/client';

/**
 * 更新草稿
 */
export const PUT: RequestHandler = async ({ request, params, locals }) => {
    // 认证检查
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to update drafts.');
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

        // 解析请求体
        let updateData: ArticleClientInput;
        try {
            updateData = await request.json();
        } catch (e) {
            throw svelteKitError(400, 'Invalid JSON format');
        }

        // 数据验证
        if (updateData.title && updateData.title.length > 200) {
            return json({ success: false, field: 'title', message: 'Title cannot exceed 200 characters.' }, { status: 400 });
        }

        if (updateData.summary && updateData.summary.length > 500) {
            return json({ success: false, field: 'summary', message: 'Summary cannot exceed 500 characters.' }, { status: 400 });
        }

        if (updateData.tags && updateData.tags.length > 10) {
            return json({ success: false, field: 'tags', message: 'You can add a maximum of 10 tags.' }, { status: 400 });
        }

        // 更新草稿，确保状态保持为 draft
        const { error: updateError } = await updateArticleById(draftId, {
            ...updateData,
            status: 'draft' // 确保状态保持为草稿
        });

        if (updateError) {
            console.error('Error updating draft:', updateError);
            throw svelteKitError(500, 'Failed to update draft');
        }

        return json({
            success: true,
            message: 'Draft updated successfully'
        });

    } catch (err: unknown) {
        console.error('API Error updating draft:', err);
        
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            throw err;
        }

        const errorMessage = (err instanceof Error) 
            ? err.message 
            : 'An unexpected error occurred while updating draft.';
        throw svelteKitError(500, `Internal Server Error: ${errorMessage}`);
    }
};

/**
 * 删除草稿
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
    // 认证检查
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to delete drafts.');
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

        // 删除草稿
        const { error: deleteError } = await deleteArticleById(draftId);
        if (deleteError) {
            console.error('Error deleting draft:', deleteError);
            throw svelteKitError(500, 'Failed to delete draft');
        }

        return json({
            success: true,
            message: 'Draft deleted successfully'
        });

    } catch (err: unknown) {
        console.error('API Error deleting draft:', err);
        
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            throw err;
        }

        const errorMessage = (err instanceof Error) 
            ? err.message 
            : 'An unexpected error occurred while deleting draft.';
        throw svelteKitError(500, `Internal Server Error: ${errorMessage}`);
    }
};
