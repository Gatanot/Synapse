/**
 * 从服务器发送到客户端的评论数据结构。
 * 移除了敏感信息，并将 ObjectId 转换为字符串。
 */
export interface CommentClient {
    _id: string;
    articleId: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}

/**
 * 从客户端请求体中接收的用于创建评论的数据。
 * 不包含任何由服务器（如会话）添加的信息。
 */
export interface CommentClientInput {
    content: string;
}