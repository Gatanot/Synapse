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
    // 不包含 comments, likes, updatedAt 等字段，除非特别需要
}