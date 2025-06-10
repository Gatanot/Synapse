// src/routes/api/articles/[id]/+server.ts
import { json, error as svelteKitError } from '@sveltejs/kit';
import { getArticleById, } from '$lib/server/db/articleCollection'; // 引入新函数
import type { RequestHandler } from './$types';
import type { ArticleSchema } from '$lib/schema';
import type { ArticleClient } from '$lib/types/client';

/**
 * 将数据库的 ArticleSchema 对象转换为客户端安全的 ArticleClient 对象。
 * @param article - 从数据库获取的 ArticleSchema 对象。
 * @returns 客户端安全的 ArticleClient 对象。
 */
function mapArticleToClient(article: ArticleSchema): ArticleClient {
    return {
        _id: article._id.toString(),
        title: article.title,
        summary: article.summary,
        tags: article.tags,
        authorId: article.authorId.toString(),
        authorName: article.authorName,
        body: article.body, // 默认包含 body
        createdAt: article.createdAt,
        status: article.status,
    };
}
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