/**
 * @fileoverview 评论数据模式定义
 * @description 定义评论集合的数据结构和字段规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 评论数据模式接口
 * @interface CommentSchema
 * @description 定义comments集合中文档的完整结构
 * @property {ObjectId} _id - 评论唯一标识符
 * @property {ObjectId} articleId - 所属文章的ID，引用ArticleSchema._id
 * @property {ObjectId} authorId - 评论作者的用户ID，引用UserSchema._id
 * @property {string} authorName - 评论作者姓名，冗余存储以提高查询性能
 * @property {string} content - 评论文本内容
 * @property {Date} createdAt - 评论创建时间
 */
export interface CommentSchema {
    _id: ObjectId;
    articleId: ObjectId;
    authorId: ObjectId;
    authorName: string;
    content: string;
    createdAt: Date;
}