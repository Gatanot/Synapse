/**
 * @fileoverview 验证码集合操作模块
 * @description 提供注册验证码的保存、验证、清理等功能，确保用户注册安全性
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection } from './db';
import type { RegisterCodeSchema } from '$lib/schema/verifyCodeSchema';

const COLLECTION_NAME = 'register_codes';

/**
 * 为验证码集合创建 TTL 索引
 * @description 创建基于过期时间的自动删除索引，确保过期验证码被自动清理
 * @returns {Promise<void>}
 * @throws {Error} 当索引创建失败时抛出错误
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
 * 保存或更新验证码
 * @description 为邮箱生成验证码，同一邮箱只保留最新一条以防止验证码滥用
 * @param {string} email - 用户邮箱地址
 * @param {string} code - 6位数字验证码
 * @param {number} expireSeconds - 验证码有效期（秒）
 * @returns {Promise<void>}
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function saveRegisterCode(email: string, code: string, expireSeconds: number): Promise<void> {
    const codes = await getCollection<RegisterCodeSchema>(COLLECTION_NAME);
    const expiresAt = new Date(Date.now() + expireSeconds * 1000);
    await codes.updateOne(
        { email },
        { $set: { code, expiresAt } },
        { upsert: true }
    );
}

/**
 * 校验验证码有效性
 * @description 验证用户输入的验证码是否正确且未过期，验证成功后立即删除以防重复使用
 * @param {string} email - 用户邮箱地址
 * @param {string} code - 用户输入的验证码
 * @returns {Promise<boolean>} 验证是否成功
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function checkRegisterCode(email: string, code: string): Promise<boolean> {
    const codes = await getCollection<RegisterCodeSchema>(COLLECTION_NAME);
    const doc = await codes.findOne({ email, code });
    if (!doc) return false;
    if (doc.expiresAt < new Date()) return false;
    await codes.deleteOne({ email, code });
    return true;
}
