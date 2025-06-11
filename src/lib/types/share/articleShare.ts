// src/lib/types/article.ts

import type { ArticleSchema, ArticleStatus } from "$lib/schema";
import type { ArticleClient } from "../client";
/**
 * 将数据库的 ArticleSchema 对象转换为客户端安全的 ArticleClient 对象。
 * @param article - 从数据库获取的 ArticleSchema 对象。
 * @returns 客户端安全的 ArticleClient 对象。
 */
export function mapArticleToClient(article: ArticleSchema): ArticleClient {
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
 *   用于创建新文章的数据传输对象 (DTO)。
 * 从前端表单传递到后端。
 */
export interface ArticleCreateShare {
    title: string;
    summary: string;
    tags: string[];
    authorId: string; // 在传输时是字符串
    authorName: string;
    body: string;
    status?: ArticleStatus;
}