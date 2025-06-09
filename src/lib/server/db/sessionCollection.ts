// src/lib/server/db/sessionCollection.ts

import { getCollection, ObjectId } from './db';
import type { SessionSchema } from '$lib/schema';
import type { DbResult } from '$lib/schema/db';
import type { SessionUserData, CreateSessionResult } from '$lib/types/share';
import type { DeleteResult } from 'mongodb';
import crypto from 'node:crypto';

const COLLECTION_NAME = 'sessions';

/**
 * 为 sessions 集合创建必要的索引。
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
                articles: userData.articles || []
            },
            expiresAt: expiresAt
        };
        
        await sessions.insertOne(newSession);

        console.log(`Session created: ${sessionId} for user ${userId}, expires at ${expiresAt.toISOString()}`);
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

        console.log(`Session found and valid: ${sessionId}`);
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