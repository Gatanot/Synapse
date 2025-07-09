import type { ObjectId } from 'mongodb';

/**
 * 消息类型
 * 'comment'：评论通知
 * 'like'：点赞通知
 */
export type MessageType = 'comment' | 'like';

/**
 * 消息通知的 schema
 */
export interface MessageSchema {
  _id: ObjectId;
  userId: ObjectId; // 接收消息的用户
  type: MessageType; // 消息类型
  articleId: ObjectId; // 相关的文章
  articleTitle: string; // 文章标题
  commentId?: ObjectId; // 如果是评论通知，关联的评论ID
  commentContent?: string; // 如果是评论通知，评论内容
  fromUserId: ObjectId; // 触发消息的用户
  fromUserName: string; // 触发消息的用户名
  createdAt: Date; // 消息创建时间
  isRead: boolean; // 是否已读
}
