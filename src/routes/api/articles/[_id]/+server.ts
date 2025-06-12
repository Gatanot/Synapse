// src/routes/api/articles/[id]/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticleById, updateArticleById } from '$lib/server/db/articleCollection'; // 更新导入
import type { RequestHandler } from '@sveltejs/kit';
import type { ArticleClientInput } from '$lib/types/client';
import type { ArticleSchema, ArticleStatus } from '$lib/schema'; // 确保导入正确
import { mapArticleToClient } from '$lib/types/share'; // 确保导入正确
/**
 * 处理 GET 请求，根据文章 ID 返回完整的文章信息。
 * API 端点: GET /api/articles/[id]
 */
export const GET: RequestHandler = async ({ params }) => {
    // 1. 从 URL 中获取动态参数 'id'
    // SvelteKit 5+ 中 params 的 key 就是文件名 [id]
    const { _id } = params;

    if (!_id) {
        throw svelteKitError(400, 'Article ID is required.');
    }
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
 * 处理 POST 请求，根据文章 ID 更新文章的一个或多个字段。
 *
 * API 端点: POST /api/articles/[_id]
 * 请求体 (Body): JSON 对象，包含需要更新的字段，例如：
 * {
 *   "title": "新的标题",
 *   "body": "更新后的文章正文...",
 *   "tags": ["sveltekit", "typescript", "mongodb"]
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
    const { _id } = params;

    // 1. 验证基本前提：ID 和用户认证
    if (!_id) {
        // 在 SvelteKit 路由中，这种情况几乎不会发生，但作为防御性措施是好的
        throw svelteKitError(400, 'Article ID is required.');
    }

    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to update an article.');
    }

    // 2. 解析并验证请求体
    let clientInput: Partial<ArticleClientInput>; // 使用 Partial，因为客户端可能只发送部分字段
    try {
        clientInput = await request.json();
    } catch (error) {
        // 如果请求体不是有效的 JSON，则返回 400
        throw svelteKitError(400, 'Invalid JSON format in request body.');
    }

    // 3. 构建一个干净的、待更新的数据对象 (DTO - Data Transfer Object)
    //    并对每个传入的字段进行严格的类型和内容验证。
    const updateData: Partial<ArticleSchema> = {};

    if (clientInput.title !== undefined) {
        if (typeof clientInput.title !== 'string' || clientInput.title.trim() === '') {
            throw svelteKitError(400, 'Title, if provided, must be a non-empty string.');
        }
        updateData.title = clientInput.title.trim();
    }
    if (clientInput.summary !== undefined) {
        if (typeof clientInput.summary !== 'string' || clientInput.summary.trim() === '') {
            throw svelteKitError(400, 'Summary, if provided, must be a non-empty string.');
        }
        updateData.summary = clientInput.summary.trim();
    }
    if (clientInput.body !== undefined) {
        if (typeof clientInput.body !== 'string' || clientInput.body.trim() === '') {
            throw svelteKitError(400, 'Body, if provided, must be a non-empty string.');
        }
        updateData.body = clientInput.body.trim();
    }
    if (clientInput.tags !== undefined) {
        if (!Array.isArray(clientInput.tags) || !clientInput.tags.every((tag) => typeof tag === 'string')) {
            throw svelteKitError(400, 'Tags, if provided, must be an array of strings.');
        }
        updateData.tags = clientInput.tags;
    }
    if (clientInput.status !== undefined) {
        const validStatuses: ArticleStatus[] = ['draft', 'published'];
        if (!validStatuses.includes(clientInput.status)) {
            throw svelteKitError(400, `Status, if provided, must be one of: ${validStatuses.join(', ')}.`);
        }
        updateData.status = clientInput.status;
    }

    // 如果经过验证后，没有可更新的字段，则直接返回成功，避免不必要的数据库操作
    if (Object.keys(updateData).length === 0) {
        return json({ success: true, message: 'No valid fields provided to update.' }, { status: 200 });
    }

    // 为所有有效的更新操作添加服务器端生成的时间戳
    updateData.updatedAt = new Date();

    try {
        // 4. 获取文章并验证所有权（授权）
        const { data: article, error: fetchError } = await getArticleById(_id);

        if (fetchError) {
            console.error(`DB error while fetching article for update (ID: ${_id}):`, fetchError.message);
            throw svelteKitError(500, 'An internal server error occurred while fetching the article.');
        }

        if (!article) {
            throw svelteKitError(404, `Article with ID ${_id} not found.`);
        }

        if (article.authorId.toString() !== locals.user._id) {
            throw svelteKitError(403, 'Forbidden: You are not the author of this article.');
        }

        // 5. 执行数据库更新操作
        const { error: updateError } = await updateArticleById(_id, updateData);

        if (updateError) {
            // 根据我们之前的讨论，这里处理的是 updateArticleById 返回的错误，
            // 比如 NOT_FOUND (虽然在这里不太可能发生，因为我们已经获取过文章了)
            console.error(`DB error while updating article (ID: ${_id}):`, updateError.message);
            throw svelteKitError(500, 'Failed to update the article in the database.');
        }

        // 6. 返回成功的响应
        return json({ success: true, message: 'Article updated successfully.' }, { status: 200 });
    } catch (err) {
        // 捕获上面流程中 throw 的 svelteKitError，或者任何其他意外错误
        if (err instanceof Error && 'status' in err) {
            // 如果是 SvelteKit 的 error 对象，直接重新抛出
            throw err;
        }
        // 对于未知的、意料之外的错误
        console.error(`Unexpected error while updating article (ID: ${_id}):`, err);
        throw svelteKitError(500, 'An unexpected server error occurred.');
    }
};