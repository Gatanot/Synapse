import { json, error as svelteKitError } from '@sveltejs/kit';
import { createArticle } from '$lib/server/db/articleCollection';
// 从你的 db.js 导入 ObjectId 以便在需要时验证或转换
// import { ObjectId } from '$lib/server/db/db';

/**
 * @typedef {Object} ArticleClientInput
 * @property {string} title - 文章标题
 * @property {string} summary - 文章简介
 * @property {string[]} tags - 文章标签数组
 * @property {string} body - 文章正文 (Markdown 字符串)
 * @property {'draft' | 'published'} [status] - (可选) 文章状态，默认为 'published'
 */

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
    // 1. --- 认证 ---
    // 确保用户已登录才能创建文章
    if (!locals.user || !locals.user.id) { // 假设 locals.user 包含 id, name, email
        throw svelteKitError(401, 'Unauthorized: You must be logged in to create an article.');
    }


    let clientInput;
    try {
        clientInput = await request.json();
    } catch (e) {
        console.error("Error parsing JSON body:", e);
        throw svelteKitError(400, 'Bad Request: Invalid JSON format.');
    }

    // 3. --- 数据验证 ---
    // 对客户端发送的数据进行基础验证
    if (!clientInput.title || typeof clientInput.title !== 'string' || clientInput.title.trim() === '') {
        return json({ success: false, field: 'title', message: 'Title is required and cannot be empty.' }, { status: 400 });
    }
    if (clientInput.title.length > 200) { // 假设标题长度限制
        return json({ success: false, field: 'title', message: 'Title cannot exceed 200 characters.' }, { status: 400 });
    }

    if (!clientInput.summary || typeof clientInput.summary !== 'string' || clientInput.summary.trim() === '') {
        return json({ success: false, field: 'summary', message: 'Summary is required and cannot be empty.' }, { status: 400 });
    }
    if (clientInput.summary.length > 500) { // 假设简介长度限制
        return json({ success: false, field: 'summary', message: 'Summary cannot exceed 500 characters.' }, { status: 400 });
    }

    if (!clientInput.tags || !Array.isArray(clientInput.tags) || !clientInput.tags.every(tag => typeof tag === 'string')) {
        return json({ success: false, field: 'tags', message: 'Tags must be an array of strings.' }, { status: 400 });
    }
    if (clientInput.tags.some(tag => tag.trim() === '')) {
        return json({ success: false, field: 'tags', message: 'Tags cannot contain empty strings. Please remove or fill them.' }, { status: 400 });
    }
    if (clientInput.tags.length > 10) { // 假设标签数量限制
        return json({ success: false, field: 'tags', message: 'You can add a maximum of 10 tags.' }, { status: 400 });
    }


    if (!clientInput.body || typeof clientInput.body !== 'string' || clientInput.body.trim() === '') {
        return json({ success: false, field: 'body', message: 'Body content is required and cannot be empty.' }, { status: 400 });
    }


    // 4. --- 准备要存入数据库的数据 ---
    // articleCollection.js 中的 createArticle 函数会处理 tags 的 trim/toLowerCase/filter
    // 和 authorId 的 ObjectId 转换，以及 createdAt/updatedAt 的设置。
    const articleDataForDb = {
        title: clientInput.title.trim(),
        summary: clientInput.summary.trim(),
        tags: clientInput.tags, // 直接传递，createArticle 会处理
        body: clientInput.body.trim(),
        authorId: locals.user.id, // 从会话获取用户ID
        authorName: locals.user.name || locals.user.email || 'Anonymous', // 从会话获取用户名
        status: 'published',
    };

    // 5. --- 调用数据库操作创建文章 ---
    try {
        const creationResult = await createArticle(articleDataForDb);

        if (!creationResult || !creationResult.insertedId) {
            console.error('Failed to create article or no insertedId returned from createArticle.');
            throw svelteKitError(500, 'Internal Server Error: Could not save the article. Please try again later.');
        }

        return json({
            success: true,
            message: 'Article created successfully!',
            article_id: creationResult.insertedId.toString(),
        }, { status: 201 }); // 201 Created

    } catch (err) {
        console.error('API Error creating article:', err);
        // 如果是 SvelteKit 的 error (例如上面我们 throw 的)
        if (err.status && err.body) {
            throw err;
        }
        // 其他未知错误
        throw svelteKitError(500, `Internal Server Error: ${err.message || 'An unexpected error occurred while creating the article.'}`);
    }
}