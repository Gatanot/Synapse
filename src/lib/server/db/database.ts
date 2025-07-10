/**
 * @fileoverview 数据库初始化和索引管理模块
 * @description 提供数据库连接初始化、索引创建和管理员账户初始化功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { connectToDatabase } from './db';
import { ensureArticleIndexes } from './articleCollection';
import { ensureUserIndexes } from './userCollection';
import { ensureSessionIndexes } from './sessionCollection';
import { ensureCommentIndexes } from './commentCollection';
import { ensureAdminIndexes } from './adminCollection';
import { ensureRegisterCodeIndexes } from './verifyCode';
import { initializeAdminsComplete } from './adminCollection';

/**
 * 统一确保所有集合的索引都已创建
 * @description 遍历所有数据库集合，确保必要的索引已创建以优化查询性能
 * @throws {Error} 当索引创建发生致命错误时抛出异常
 */
export async function ensureAllIndexes() {
    console.log("Ensuring all database indexes...");
    try {
        await ensureUserIndexes();
        await ensureSessionIndexes();
        await ensureArticleIndexes();
        await ensureCommentIndexes();
        await ensureAdminIndexes();
        await ensureRegisterCodeIndexes();
        console.log("All indexes ensured successfully.");
    } catch (error: any) {
        // 处理索引冲突错误，这些通常是非致命的警告
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
            console.warn(`Warning ensuring indexes: ${error.message}.`);
        } else if (error.codeName === 'IndexKeySpecsConflict' || error.code === 86) {
            console.warn(`Warning ensuring indexes: ${error.message}.`);
        } else {
            console.error("A critical error occurred during index creation:", error);
            throw error;
        }
    }
}

/**
 * 初始化数据库连接并确保所有索引
 * @description 应用启动时调用的主要初始化函数，完成数据库连接、索引创建和默认管理员账户设置
 * @throws {Error} 当数据库初始化失败时抛出异常
 */
export async function initializeDatabase() {
    await connectToDatabase();
    await ensureAllIndexes();
    // 初始化默认超级管理员账户
    initializeAdminsComplete({
        name: "synapse",
        email: "synapse@admin.com",
        password: "admin123456",
        signature: ""
    });
}