import type { ArticleStatus } from "$lib/schema";
/**
 * @description 从服务器发送到客户端的文章数据结构。
 * 移除了敏感信息，并将 ObjectId 转换为字符串。
 */
export interface ArticleClient {
    _id: string;
    title: string;
    summary: string;
    tags: string[];
    authorId: string;
    authorName: string;
    body?: string; // body 是可选的，取决于查询是否包含它
    createdAt: Date;
    status: ArticleStatus;
}
// 在 src/lib/types/article.ts 中新增

/**
 * @description 从客户端请求体中接收的用于创建文章的数据。
 * 不包含任何由服务器（如会话）添加的信息。
 */
export interface ArticleClientInput {
    title: string;
    summary: string;
    tags: string[];
    body: string;
    status?: 'draft' | 'published';
}