/**
 * @fileoverview 消息通知数据模式定义
 * @description 定义消息通知集合的数据结构和消息类型规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 消息类型联合类型
 * @typedef {string} MessageType
 * @description 定义系统支持的消息通知类型
 * - 'comment': 评论通知，当用户文章收到新评论时发送
 * - 'like': 点赞通知，当用户文章被点赞时发送
 */
export type MessageType = 'comment' | 'like';

/**
 * 消息通知数据模式接口
 * @interface MessageSchema
 * @description 定义messages集合中文档的完整结构，用于存储用户消息通知
 * @property {ObjectId} _id - 消息唯一标识符
 * @property {ObjectId} userId - 接收消息的用户ID，引用UserSchema._id
 * @property {MessageType} type - 消息类型，决定通知的展示方式
 * @property {ObjectId} articleId - 相关文章的ID，引用ArticleSchema._id
 * @property {string} articleTitle - 文章标题，冗余存储以提高查询性能
 * @property {ObjectId} [commentId] - 评论ID，仅在type为'comment'时存在
 * @property {string} [commentContent] - 评论内容，仅在type为'comment'时存在
 * @property {ObjectId} fromUserId - 触发消息的用户ID，引用UserSchema._id
 * @property {string} fromUserName - 触发消息的用户名，冗余存储以提高查询性能
 * @property {Date} createdAt - 消息创建时间
 * @property {boolean} isRead - 消息是否已被用户阅读
 */
export interface MessageSchema {
  _id: ObjectId;
  userId: ObjectId;
  type: MessageType;
  articleId: ObjectId;
  articleTitle: string;
  commentId?: ObjectId;
  commentContent?: string;
  fromUserId: ObjectId;
  fromUserName: string;
  createdAt: Date;
  isRead: boolean;
}
