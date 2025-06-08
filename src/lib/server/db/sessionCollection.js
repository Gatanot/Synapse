import { getCollection, ObjectId } from './db';
import crypto from 'node:crypto';
const COLLECTION_NAME = 'sessions';
/**
 * 为 sessions 集合创建必要的索引。
 */
export async function ensureSessionIndexes() {
    try {
        const sessions = await getCollection(COLLECTION_NAME);
        // 创建 TTL 索引，MongoDB 会自动删除过期的会话文档
        await sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
        console.log("TTL index on sessions.expiresAt ensured.");
    } catch (error) {
        // 将错误向上抛出
        throw error;
    }
}
/**
 * 创建一个新的会话。
 * @param {string} userId 用户的 ObjectId 字符串
 * @param {object} userData 要存储在会话中的用户数据
 * @param {number} expiresInMs 会话有效时长 (毫秒)
 * @returns {Promise<{data: {sessionId: string, expiresAt: Date} | null, error: {code: string, message: string} | null}>}
 */
export async function createSession(userId, userData, expiresInMs) {
    try {
        const sessions = await getCollection(COLLECTION_NAME);
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + expiresInMs);

        await sessions.insertOne({
            _id: sessionId,
            userId: new ObjectId(userId),
            userData: {
                name: userData.name,
                email: userData.email,
                articles: userData.articles || []
            },
            expiresAt: expiresAt
        });

        console.log(`Session created: ${sessionId} for user ${userId}, expires at ${expiresAt.toISOString()}`);
        return { data: { sessionId, expiresAt }, error: null };
    } catch (error) {
        const message = 'An unexpected error occurred while creating the session.';
        console.error(`Error creating session for user ${userId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据会话ID查找会话。
 * @param {string} sessionId
 * @returns {Promise<{data: object | null, error: {code: string, message: string} | null}>}
 */
export async function findSessionById(sessionId) {
    if (!sessionId) {
        return { data: null, error: { code: 'INVALID_INPUT', message: 'Session ID is required.' } };
    }

    try {
        const sessions = await getCollection(COLLECTION_NAME);
        const session = await sessions.findOne({ _id: sessionId });

        if (!session) {
            console.log(`Session not found: ${sessionId}`);
            return { data: null, error: null }; // 未找到是正常情况
        }

        if (session.expiresAt < new Date()) {
            console.log(`Session expired: ${sessionId}. Deleting...`);
            await deleteSessionById(sessionId); // 顺便删除，此处的错误可以忽略
            return { data: null, error: null }; // 已过期，视为未找到
        }

        console.log(`Session found and valid: ${sessionId}`);
        return { data: session, error: null };
    } catch (error) {
        const message = 'An unexpected error occurred while finding the session.';
        console.error(`Error finding session by ID ${sessionId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据会话ID删除会话 (用于登出或过期处理)。
 * @param {string} sessionId
 * @returns {Promise<{data: import('mongodb').DeleteResult | null, error: {code: string, message: string} | null}>}
 */
export async function deleteSessionById(sessionId) {
    if (!sessionId) {
        return { data: null, error: { code: 'INVALID_INPUT', message: 'Session ID is required.' } };
    }
    try {
        const sessions = await getCollection(COLLECTION_NAME);
        const result = await sessions.deleteOne({ _id: sessionId });
        console.log(`Session deleted: ${sessionId}, count: ${result.deletedCount}`);
        return { data: result, error: null };
    } catch (error) {
        const message = 'An unexpected error occurred while deleting the session.';
        console.error(`Error deleting session ${sessionId}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}