// src/routes/api/articles/[id]/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticleById, updateArticleById } from '$lib/server/db/articleCollection'; // 更新导入
import type { RequestHandler } from '@sveltejs/kit';
import type { ArticleClientInput } from '$lib/types/client';
import { mapArticleToClient } from '$lib/types/share'; // 确保导入正确
/**
 * 处理 GET 请求，根据文章 ID 返回完整的文章信息。
 * API 端点: GET /api/articles/[id]
 */
export const GET: RequestHandler = async ({ params }) => {
    // 1. 从 URL 中获取动态参数 'id'
    // SvelteKit 5+ 中 params 的 key 就是文件名 [id]
    const { _id } = params;

    // 如果 id 不存在（理论上不太可能，因为路由匹配了），SvelteKit 会处理
    // 但为了健壮性，可以加个检查
    if (!_id) {
        throw svelteKitError(400, 'Article ID is required.');
    }
    console.log(_id)
    try {
        // 2. 调用新的数据库函数获取文章
        const result = await getArticleById(_id);

        // 3. 处理数据库函数返回的错误
        if (result.error) {
            // 根据错误码决定响应
            if (result.error.code === 'INVALID_ID_FORMAT') {
                throw svelteKitError(400, result.error.message);
            }
            // 对于其他所有 DB_ERROR，抛出 500
            console.error(`Database error fetching article ${_id}:`, result.error);
            throw svelteKitError(500, 'An internal server error occurred while fetching the article.');
        }

        // 4. 处理文章未找到的情况 (data 为 null)
        if (!result.data) {
            throw svelteKitError(404, `Article with ID ${_id} not found.`);
        }

        // 5. 成功时，将数据库对象映射为客户端对象并返回
        const articleForClient = mapArticleToClient(result.data);

        return json(articleForClient, { status: 200 });

    } catch (err: unknown) {
        // 捕获所有抛出的 svelteKitError 或其他意外错误
        if (typeof err === 'object' && err !== null && 'status' in err) {
            // 如果是 SvelteKit 的 HttpError，直接重新抛出
            throw err;
        }

        console.error(`Unexpected error in GET /api/articles/${_id}:`, err);
        throw svelteKitError(500, 'An unexpected server error occurred.');
    }
};
/**
 * 处理 POST 请求，根据文章 ID 更新文章内容。
 * API 端点: POST /api/articles/[id]
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
    const { _id } = params;

    if (!_id) {
        throw svelteKitError(400, 'Article ID is required.');
    }

    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to update an article.');
    }

    let clientInput: ArticleClientInput;
    try {
        clientInput = await request.json();
    } catch (error) {
        console.error('Error parsing JSON body:', error);
        throw svelteKitError(400, 'Invalid JSON format.');
    }

    if (!clientInput.body || typeof clientInput.body !== 'string' || clientInput.body.trim() === '') {
        throw svelteKitError(400, 'Body content is required and cannot be empty.');
    }

    try {
        const { data: article, error: fetchError } = await getArticleById(_id);

        if (fetchError) {
            console.error(`Error fetching article with ID ${_id}:`, fetchError);
            throw svelteKitError(500, 'An internal server error occurred while fetching the article.');
        }

        if (!article) {
            throw svelteKitError(404, `Article with ID ${_id} not found.`);
        }

        if (article.authorId.toString() !== locals.user._id) {
            throw svelteKitError(403, 'You are not authorized to update this article.');
        }

        const { error: updateError } = await updateArticleById(_id, {
            body: clientInput.body.trim(),
            updatedAt: new Date()
        });

        if (updateError) {
            console.error(`Error updating article with ID ${_id}:`, updateError);
            throw svelteKitError(500, 'Failed to update the article.');
        }

        return json({ success: true, message: 'Article updated successfully.' }, { status: 200 });
    } catch (error) {
        console.error(`Unexpected error updating article with ID ${_id}:`, error);
        throw svelteKitError(500, 'An unexpected server error occurred.');
    }
};