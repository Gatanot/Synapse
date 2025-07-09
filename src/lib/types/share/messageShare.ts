/**
 * 消息类型
 */
export type MessageType = 'comment' | 'like';

/**
 * 创建消息的表单类型
 */
export interface MessageCreateForm {
  userId: string; // 接收消息的用户ID
  type: MessageType; // 消息类型
  articleId: string; // 相关的文章ID
  articleTitle: string; // 文章标题
  commentId?: string; // 评论ID（仅评论通知有）
  commentContent?: string; // 评论内容（仅评论通知有）
  fromUserId: string; // 触发消息的用户ID
  fromUserName: string; // 触发消息的用户名
}
