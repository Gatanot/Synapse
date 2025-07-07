// src/lib/server/db/verifyCode.ts

import { getCollection } from './db';

import type { RegisterCodeSchema } from '$lib/schema/verifyCodeSchema';

const COLLECTION_NAME = 'register_codes';

/**
 * 为 register_codes 集合创建 TTL 索引。
 */
export async function ensureRegisterCodeIndexes(): Promise<void> {
    try {
        const codes = await getCollection<RegisterCodeSchema>(COLLECTION_NAME);
        await codes.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
        console.log("TTL index on register_codes.expiresAt ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 保存或更新验证码（同一邮箱只保留最新一条）。
 * @param email 邮箱
 * @param code 验证码
 * @param expireSeconds 有效期（秒）
 */
export async function saveRegisterCode(email: string, code: string, expireSeconds: number): Promise<void> {
    const codes = await getCollection<RegisterCodeSchema>(COLLECTION_NAME);
    const expiresAt = new Date(Date.now() + expireSeconds * 1000);//现在有效期
    await codes.updateOne(
        { email },
        { $set: { code, expiresAt } },
        { upsert: true }
    );
}

/**
 * 校验验证码，正确且未过期返回 true，并删除该验证码。
 * @param email 邮箱
 * @param code 验证码
 */
export async function checkRegisterCode(email: string, code: string): Promise<boolean> {
    const codes = await getCollection<RegisterCodeSchema>(COLLECTION_NAME);
    const doc = await codes.findOne({ email, code });
    if (!doc) return false;
    if (doc.expiresAt < new Date()) return false;
    await codes.deleteOne({ email, code });
    return true;
}
