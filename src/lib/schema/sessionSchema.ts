import type { ObjectId } from 'mongodb';

/**
 *   代表 'sessions' 集合中的文档结构。
 * 用于存储用户的会话信息。
 */
export interface SessionSchema {
    /**
     * 会话ID, 是一个 UUID 字符串，而不是 ObjectId。
     * 这在 `sessionCollection.js` 的 `createSession` 中由 `crypto.randomUUID()` 生成。
     */
    _id: string;
    userId: ObjectId; // 引用 UserSchema 的 _id

    /**
     * 存储在会话中的非敏感用户数据，用于快速访问。
     */
    userData: {
        _id: ObjectId;
        name: string;
        email: string;
        articles: ObjectId[]; // 与 UserSchema 保持一致
        likes: ObjectId[]; // 新增 likes 字段，与 UserSchema 保持一致
    };

    /**
     * 会话的过期时间，用于 TTL 索引自动清理。
     */
    expiresAt: Date;
}