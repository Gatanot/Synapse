import type { ObjectId } from 'mongodb';

/**
 * 代表 'comments' 集合中的文档结构。
 */
export interface CommentSchema {
    _id: ObjectId;
    articleId: ObjectId; // 所属文章的 ID
    authorId: ObjectId; // 评论作者的 ID
    authorName: string; // 评论作者的姓名
    content: string; // 评论内容
    createdAt: Date;
}