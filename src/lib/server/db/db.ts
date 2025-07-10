/**
 * @fileoverview MongoDB数据库连接和通用操作模块
 * @description 提供数据库连接管理、通用类型定义和基础操作功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { MongoClient, ServerApiVersion, Db, Collection, ObjectId as MongoObjectId, type Document } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';

/**
 * 数据库错误对象接口
 * @interface DbError
 * @property {string} code - 错误码，用于程序化判断错误类型
 * @property {string} message - 错误描述信息，用于日志记录和调试
 */
export interface DbError {
    code: string;
    message: string;
}

/**
 * 数据库操作结果封装接口
 * @interface DbResult
 * @template T - 成功时返回数据的类型
 * @property {T | null} data - 操作成功时的返回数据，失败时为null
 * @property {DbError | null} error - 操作失败时的错误信息，成功时为null
 */
export interface DbResult<T> {
    data: T | null;
    error: DbError | null;
}

// 环境变量验证
if (!MONGODB_URL) {
    throw new Error('MongoDB connection string (MONGODB_URL) is not defined in environment variables.');
}
if (!MONGODB_DB_NAME) {
    throw new Error('MongoDB database name (MONGODB_DB_NAME) is not defined in environment variables.');
}

// MongoDB客户端实例，使用API版本1配置
const client = new MongoClient(MONGODB_URL, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// 数据库实例单例
let dbInstance: Db | null = null;

/**
 * 连接到MongoDB数据库
 * @description 建立数据库连接并返回数据库实例，使用单例模式避免重复连接
 * @returns {Promise<Db>} 数据库实例
 * @throws {Error} 当连接失败时抛出错误
 */
export async function connectToDatabase(): Promise<Db> {
    if (dbInstance) {
        return dbInstance;
    }
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        dbInstance = client.db(MONGODB_DB_NAME);
        return dbInstance;
    } catch (e) {
        console.error('Failed to connect to MongoDB', e);
        throw new Error('Could not connect to database');
    }
}

/**
 * 获取MongoDB客户端实例
 * @description 返回MongoDB客户端实例，主要用于需要客户端级别操作的场景（如事务处理）
 * @returns {MongoClient} MongoDB客户端实例
 */
export function getClient(): MongoClient {
    return client;
}

/**
 * 获取指定集合的类型化Collection对象
 * @template T - 集合文档的Schema类型，必须继承自Document
 * @param {string} COLLECTION_NAME - 集合名称
 * @returns {Promise<Collection<T>>} 类型化的集合对象
 * @description 根据集合名称返回类型安全的集合操作对象
 */
export async function getCollection<T extends Document>(COLLECTION_NAME: string): Promise<Collection<T>> {
    const db = await connectToDatabase();
    return db.collection<T>(COLLECTION_NAME);
}

// 重新导出ObjectId以便在其他模块中使用
export { MongoObjectId as ObjectId };