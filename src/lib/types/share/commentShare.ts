/**
 * 用于创建新评论的数据传输对象 (DTO)。
 * 从前端表单传递到后端。
 */
export interface CommentCreateShare {
    content: string;
    articleId: string; // 在传输时是字符串
    authorId: string; // 在传输时是字符串
    authorName: string;
}

/**
 * 评论表单的数据结构
 */
export interface CommentForm {
    content: string;
}