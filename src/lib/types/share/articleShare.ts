/**
 * @fileoverview 文章共享类型定义
 * @description 定义文章相关的数据转换函数和传输对象，用于前后端数据交互
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ArticleSchema, ArticleStatus } from "$lib/schema";
import type { ArticleClient } from "../client";

/**
 * 将数据库文章对象转换为客户端安全对象
 * @description 将MongoDB ObjectId转换为字符串，确保前端能正确处理
 * @param {ArticleSchema} article - 数据库中的文章文档
 * @returns {ArticleClient} 客户端安全的文章对象
 */
export function mapArticleToClient(article: ArticleSchema): ArticleClient {
    return {
        _id: article._id.toString(),
        title: article.title,
        summary: article.summary,
        tags: article.tags,
        authorId: article.authorId.toString(),
        authorName: article.authorName,
        body: article.body,
        createdAt: article.createdAt,
        status: article.status,
        likes: article.likes,
    };
}

/**
 * 文章创建数据传输对象
 * @description 前端文章表单提交到后端的数据结构
 */
export interface ArticleCreateShare {
    /** 文章标题 */
    title: string;
    /** 文章摘要 */
    summary: string;
    /** 文章标签列表 */
    tags: string[];
    /** 作者ID（字符串形式） */
    authorId: string;
    /** 作者姓名 */
    authorName: string;
    /** 文章正文内容 */
    body: string;
    /** 文章状态，可选，默认为草稿 */
    status?: ArticleStatus;
}