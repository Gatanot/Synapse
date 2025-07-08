// src/routes/api/comments/+server.ts

import { json, error as svelteKitError } from '@sveltejs/kit';
import { createComment, getCommentsByArticleId } from '$lib/server/db/commentCollection';
import type { RequestHandler } from '@sveltejs/kit';
import type { CommentClientInput } from '$lib/types/client';
import type { CommentCreateShare } from '$lib/types/share';

/**
 * POST /api/comments
 * 创建新评论
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    // 1. 验证用户是否登录
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to create a comment.');
    }

    // 2. 解析请求体
    let clientInput: CommentClientInput & { articleId: string };
    try {
        clientInput = await request.json();
    } catch (e) {
        console.error("Error parsing JSON body:", e);
        throw svelteKitError(400, 'Bad Request: Invalid JSON format.');
    }

    // 3. 数据验证
    if (!clientInput.content || typeof clientInput.content !== 'string' || clientInput.content.trim() === '') {
        return json({ 
            success: false, 
            field: 'content', 
            message: 'Comment content is required and cannot be empty.' 
        }, { status: 400 });
    }

    if (clientInput.content.length > 1000) {
        return json({ 
            success: false, 
            field: 'content', 
            message: 'Comment content cannot exceed 1000 characters.' 
        }, { status: 400 });
    }

    if (!clientInput.articleId || typeof clientInput.articleId !== 'string') {
        return json({ 
            success: false, 
            field: 'articleId', 
            message: 'Article ID is required.' 
        }, { status: 400 });
    }

    // 4. 准备要存入数据库的数据
    const commentDataForDb: CommentCreateShare = {
        content: clientInput.content.trim(),
        articleId: clientInput.articleId,
        authorId: locals.user._id,
        authorName: locals.user.name,
    };

    // 5. 调用数据库操作创建评论
    try {
        const creationResponse = await createComment(commentDataForDb);

        if (creationResponse.error) {
            console.error(`Failed to create comment: [${creationResponse.error.code}] ${creationResponse.error.message}`);
            throw svelteKitError(500, 'Internal Server Error: Could not save the comment. Please try again later.');
        }

        if (!creationResponse.data || !creationResponse.data.insertedId) {
            console.error('Comment creation succeeded but no insertedId was returned.');
            throw svelteKitError(500, 'Internal Server Error: Comment may have been created, but its ID could not be confirmed.');
        }

        return json({
            success: true,
            message: 'Comment created successfully!',
            comment_id: creationResponse.data.insertedId.toString(),
        }, { status: 201 });

    } catch (err: unknown) {
        console.error('API Error creating comment:', err);
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            throw err;
        }
        throw svelteKitError(500, 'An unexpected server error occurred.');
    }
};

/**
 * GET /api/comments?articleId=xxx
 * 获取指定文章的评论列表
 */
export const GET: RequestHandler = async ({ url }) => {
    const articleId = url.searchParams.get('articleId');
    const limitParam = url.searchParams.get('limit');
    const skipParam = url.searchParams.get('skip');

    if (!articleId) {
        return json({ 
            success: false, 
            message: 'Article ID is required.' 
        }, { status: 400 });
    }

    const limit = limitParam ? parseInt(limitParam) : 50;
    const skip = skipParam ? parseInt(skipParam) : 0;

    try {
        const { data: comments, error } = await getCommentsByArticleId(articleId, { limit, skip });

        if (error) {
            console.error(`Failed to fetch comments for article ${articleId}:`, error);
            if (error.code === 'INVALID_ID_FORMAT') {
                return json({ 
                    success: false, 
                    message: 'Invalid article ID format.' 
                }, { status: 400 });
            }
            throw svelteKitError(500, 'Failed to fetch comments.');
        }

        return json({
            success: true,
            comments: comments || [],
            total: comments?.length || 0
        });

    } catch (err: unknown) {
        console.error('API Error fetching comments:', err);
        if (typeof err === 'object' && err !== null && 'status' in err) {
            throw err;
        }
        throw svelteKitError(500, 'An unexpected server error occurred.');
    }
};