// src/lib/types/article.ts

import type { ArticleStatus } from "$lib/schema";

/**
 * @description 用于创建新文章的数据传输对象 (DTO)。
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