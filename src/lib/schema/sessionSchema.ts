/**
 * @fileoverview 会话数据模式定义
 * @description 定义用户会话集合的数据结构和字段规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 会话数据模式接口
 * @interface SessionSchema
 * @description 定义sessions集合中文档的完整结构，用于存储用户会话信息
 * @property {string} _id - 会话ID，使用UUID字符串而非ObjectId，由crypto.randomUUID()生成
 * @property {ObjectId} userId - 关联的用户ID，引用UserSchema._id
 * @property {Object} userData - 缓存的用户数据，用于快速访问避免频繁查询用户表
 * @property {ObjectId} userData._id - 用户ID
 * @property {string} userData.name - 用户姓名
 * @property {string} userData.email - 用户邮箱
 * @property {ObjectId[]} userData.articles - 用户文章ID数组
 * @property {ObjectId[]} userData.likes - 用户点赞文章ID数组
 * @property {string} [userData.signature] - 用户个人签名
 * @property {Date} expiresAt - 会话过期时间，用于TTL索引自动清理过期会话
 */
export interface SessionSchema {
    _id: string;
    userId: ObjectId;
    userData: {
        _id: ObjectId;
        name: string;
        email: string;
        articles: ObjectId[];
        likes: ObjectId[];
        signature?: string;
    };
    expiresAt: Date;
}