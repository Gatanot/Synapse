// src/lib/server/database.ts (新文件)

import { connectToDatabase } from './db';
import { ensureArticleIndexes } from './articleCollection';
import { ensureUserIndexes } from './userCollection';
import { ensureSessionIndexes } from './sessionCollection';
import { ensureCommentIndexes } from './commentCollection';
import { ensureAdminIndexes } from './adminCollection';
import { ensureRegisterCodeIndexes } from './verifyCode';
import { initializeAdminsComplete } from './adminCollection';
/**
 * 统一确保所有集合的索引都已创建。
 * 这个函数应该在数据库连接成功后被调用。
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
 * 初始化数据库连接并确保所有索引。
 * 这是应用启动时应该调用的主要函数。
 */
export async function initializeDatabase() {
    await connectToDatabase();
    await ensureAllIndexes();
    initializeAdminsComplete({
        name: "synapse",
        email: "synapse@admin.com",
        password: "admin123456",
        signature: ""
    })
}