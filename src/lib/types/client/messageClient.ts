/**
 * 消息类型
 */
export type MessageType = 'comment' | 'like';

/**
 * 前端用的消息类型声明
 */
export interface MessageClient {
  _id: string; // 消息ID
  userId: string; // 接收消息的用户ID
  type: MessageType; // 消息类型
  articleId: string; // 相关的文章ID
  articleTitle: string; // 文章标题
  commentId?: string; // 评论ID（仅评论通知有）
  commentContent?: string; // 评论内容（仅评论通知有）
  fromUserId: string; // 触发消息的用户ID
  fromUserName: string; // 触发消息的用户名
  createdAt: string; // 消息创建时间（ISO字符串）
  isRead: boolean; // 是否已读
}
