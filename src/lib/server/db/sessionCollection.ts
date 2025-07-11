/**
 * @fileoverview 会话集合数据库操作模块
 * @description 提供用户会话相关的数据库操作，包括会话创建、查询、删除和TTL管理
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection, ObjectId } from './db';
import type { SessionSchema } from '$lib/schema';
import type { DbResult } from '$lib/schema/db';
import type { SessionUserData, CreateSessionResult } from '$lib/types/share';
import type { DeleteResult } from 'mongodb';
import crypto from 'node:crypto';

const COLLECTION_NAME = 'sessions';

/**
 * 为会话集合创建必要的索引
 * @description 创建TTL索引实现会话自动过期清理功能
 * @throws {Error} 当索引创建失败时抛出错误
 */
export async function ensureSessionIndexes(): Promise<void> {
    try {
        const sessions = await getCollection<SessionSchema>(COLLECTION_NAME);
        await sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
        console.log("TTL index on sessions.expiresAt ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 创建一个新的会话。
 * @param {string} userId 用户的 ObjectId 字符串
 * @param {SessionUserData} userData 要存储在会话中的用户数据
 * @param {number} expiresInMs 会话有效时长 (毫秒)
 * @returns {Promise<DbResult<CreateSessionResult>>}
 */
export async function createSession(
    userId: string,
    userData: SessionUserData,
    expiresInMs: number
): Promise<DbResult<CreateSessionResult>> {
    try {
        const sessions = await getCollection<SessionSchema>(COLLECTION_NAME);
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + expiresInMs);
        const userObjectId = new ObjectId(userId);

        const newSession: SessionSchema = {
            _id: sessionId,
            userId: userObjectId,
            userData: {
                _id: userObjectId, // 遵循 SessionSchema 定义
                name: userData.name,
                email: userData.email,
                articles: userData.articles || [],
                likes:userData.likes || []
            },
            expiresAt: expiresAt
        };

        await sessions.insertOne(newSession);
        return { data: { sessionId, expiresAt }, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while creating the session.';
        console.error(`Error creating session for user ${userId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据会话ID查找会话。
 * @param {string} sessionId
 * @returns {Promise<DbResult<SessionSchema | null>>}
 */
export async function findSessionById(sessionId: string): Promise<DbResult<SessionSchema | null>> {
    if (!sessionId) {
        return { data: null, error: { code: 'INVALID_INPUT', message: 'Session ID is required.' } };
    }

    try {
        const sessions = await getCollection<SessionSchema>(COLLECTION_NAME);
        const session = await sessions.findOne({ _id: sessionId });

        if (!session) {
            console.log(`Session not found: ${sessionId}`);
            return { data: null, error: null }; // 未找到是正常情况
        }

        if (session.expiresAt < new Date()) {
            console.log(`Session expired: ${sessionId}. Deleting...`);
            // 此处无需等待，也无需处理错误，避免影响主流程
            deleteSessionById(sessionId).catch(err => console.error(`Failed to delete expired session ${sessionId}`, err));
            return { data: null, error: null }; // 已过期，视为未找到
        }
        return { data: session, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while finding the session.';
        console.error(`Error finding session by ID ${sessionId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据会话ID删除会话 (用于登出或过期处理)。
 * @param {string} sessionId
 * @returns {Promise<DbResult<DeleteResult>>}
 */
export async function deleteSessionById(sessionId: string): Promise<DbResult<DeleteResult>> {
    if (!sessionId) {
        return { data: null, error: { code: 'INVALID_INPUT', message: 'Session ID is required.' } };
    }
    try {
        const sessions = await getCollection<SessionSchema>(COLLECTION_NAME);
        const result = await sessions.deleteOne({ _id: sessionId });
        console.log(`Session deleted: ${sessionId}, count: ${result.deletedCount}`);
        return { data: result, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while deleting the session.';
        console.error(`Error deleting session ${sessionId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}