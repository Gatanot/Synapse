// $lib/server/db/sessionCollection.js
import { getCollection, ObjectId } from './db';
import crypto from 'node:crypto'
const COLLECTION_NAME = 'sessions';



/**
 * 创建一个新的会话
 * @param {string} userId 用户的 ObjectId 字符串
 * @param {object} userData 要存储在会话中的用户数据 (name, email, articles)
 * @param {number} expiresInMs 会话有效时长 (毫秒)
 * @returns {Promise<{sessionId: string, expiresAt: Date}>} 返回会话ID和过期时间
 */
export async function createSession(userId, userData, expiresInMs) {
    const sessions = await getCollection(COLLECTION_NAME);
    const sessionId = crypto.randomUUID(); // 使用 Node.js 内置的 crypto 生成 UUID
    const expiresAt = new Date(Date.now() + expiresInMs);

    await sessions.insertOne({
        _id: sessionId, // 使用生成的 UUID 作为会话 ID
        userId: new ObjectId(userId), // 存储用户ID，以便后续查找
        userData: { // 存储你希望在会话中直接获取的用户信息
            name: userData.name,
            email: userData.email,
            articles: userData.articles || [] // 确保 articles 是数组
        },
        expiresAt: expiresAt
    });
    console.log(`Session created: ${sessionId} for user ${userId}, expires at ${expiresAt.toISOString()}`);
    return { sessionId, expiresAt };
}

/**
 * 根据会话ID查找会话
 * @param {string} sessionId
 * @returns {Promise<object|null>} 返回会话对象或 null
 */
export async function findSessionById(sessionId) {
    if (!sessionId) return null;
    const sessions = await getCollection(COLLECTION_NAME);
    const session = await sessions.findOne({ _id: sessionId });

    if (!session) {
        console.log(`Session not found: ${sessionId}`);
        return null;
    }

    if (session.expiresAt < new Date()) {
        console.log(`Session expired: ${sessionId}. Deleting...`);
        await deleteSessionById(sessionId); // 会话过期，顺便删除它
        return null;
    }
    console.log(`Session found and valid: ${sessionId}`);
    return session;
}

/**
 * 根据会话ID删除会话 (用于登出或过期处理)
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function deleteSessionById(sessionId) {
    if (!sessionId) return;
    const sessions = await getCollection(COLLECTION_NAME);
    await sessions.deleteOne({ _id: sessionId });
    console.log(`Session deleted: ${sessionId}`);
}
