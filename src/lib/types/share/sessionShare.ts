// src/lib/types/session.ts
import type { ObjectId } from "mongodb";

/**
 *   创建会话时传入的用户数据子集。
 */
export interface SessionUserData {
    name: string;
    email: string;
    articles: ObjectId[];
    likes: ObjectId[]; // 新增 likes 字段
}

/**
 *   createSession 函数成功时的返回数据类型。
 */
export interface CreateSessionResult {
    sessionId: string;
    expiresAt: Date;
}