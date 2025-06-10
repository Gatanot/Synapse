// src/routes/api/articles/+server.ts (假设路径)

import { json, error as svelteKitError } from '@sveltejs/kit';
import { createArticle } from '$lib/server/db/articleCollection';
import type { RequestHandler } from './$types';
import type { ArticleClientInput } from '$lib/types/client';
import type { ArticleCreateShare } from '$lib/types/share';
import type { HttpError } from '@sveltejs/kit';

// 使用 SvelteKit 自动生成的类型
export const POST: RequestHandler = async ({ request, locals }) => {
    // 1. --- 认证 ---
    // locals.user 现在是类型安全的 (UserClient | null)
    if (!locals.user) {
        throw svelteKitError(401, 'Unauthorized: You must be logged in to create an article.');
    }

    // 2. --- 解析请求体 ---
    let clientInput: ArticleClientInput;
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
    if (clientInput.title.length > 200) {
        return json({ success: false, field: 'title', message: 'Title cannot exceed 200 characters.' }, { status: 400 });
    }

    if (!clientInput.summary || typeof clientInput.summary !== 'string' || clientInput.summary.trim() === '') {
        return json({ success: false, field: 'summary', message: 'Summary is required and cannot be empty.' }, { status: 400 });
    }
    if (clientInput.summary.length > 500) {
        return json({ success: false, field: 'summary', message: 'Summary cannot exceed 500 characters.' }, { status: 400 });
    }

    if (!clientInput.tags || !Array.isArray(clientInput.tags) || !clientInput.tags.every(tag => typeof tag === 'string')) {
        return json({ success: false, field: 'tags', message: 'Tags must be an array of strings.' }, { status: 400 });
    }
    if (clientInput.tags.some(tag => tag.trim() === '')) {
        return json({ success: false, field: 'tags', message: 'Tags cannot contain empty strings. Please remove or fill them.' }, { status: 400 });
    }
    if (clientInput.tags.length > 10) {
        return json({ success: false, field: 'tags', message: 'You can add a maximum of 10 tags.' }, { status: 400 });
    }

    if (!clientInput.body || typeof clientInput.body !== 'string' || clientInput.body.trim() === '') {
        return json({ success: false, field: 'body', message: 'Body content is required and cannot be empty.' }, { status: 400 });
    }

    // 4. --- 准备要存入数据库的数据 ---
    // 将客户端输入和会话用户信息组合成完整的 DTO
    const articleDataForDb: ArticleCreateShare = {
        title: clientInput.title.trim(),
        summary: clientInput.summary.trim(),
        tags: clientInput.tags,
        body: clientInput.body.trim(),
        authorId: locals.user._id, // 类型安全：locals.user 在这里不为 null
        authorName: locals.user.name, // 使用 user.name
        status: clientInput.status || 'published', // 允许客户端设置状态
    };

    // 5. --- 调用数据库操作创建文章 ---
    try {
        const creationResponse = await createArticle(articleDataForDb);

        if (creationResponse.error) {
            console.error(`Failed to create article: [${creationResponse.error.code}] ${creationResponse.error.message}`);
            // 将内部错误包装成对客户端友好的信息
            throw svelteKitError(500, 'Internal Server Error: Could not save the article. Please try again later.');
        }

        if (!creationResponse.data || !creationResponse.data.insertedId) {
            console.error('Article creation transaction succeeded but no insertedId was returned.');
            throw svelteKitError(500, 'Internal Server Error: Article may have been created, but its ID could not be confirmed.');
        }

        return json({
            success: true,
            message: 'Article created successfully!',
            article_id: creationResponse.data.insertedId.toString(),
        }, { status: 201 });

    } catch (err: unknown) {
        console.error('API Error creating article:', err);
        if (typeof err === 'object' && err !== null && 'status' in err && 'body' in err) {
            // 我们可以断言它的类型以获得更好的类型提示，尽管在这里直接抛出也可以
            throw err as HttpError;
        }

        // 对于其他所有错误，包装成一个标准的 500 错误
        const errorMessage = (err instanceof Error)
            ? err.message
            : 'An unexpected error occurred while creating the article.';
        throw svelteKitError(500, `Internal Server Error: ${errorMessage}`);
    }
}