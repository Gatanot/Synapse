import { MongoClient, ServerApiVersion, Db, Collection, ObjectId as MongoObjectId, type Document } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';
import { ensureArticleIndexes } from './articleCollection';
import { ensureUserIndexes } from './userCollection';
import { ensureSessionIndexes } from './sessionCollection';
/**
 * @description 代表数据库操作中结构化的错误对象。
 * code: 用于程序化判断的错误码。
 * message: 用于日志记录或调试的描述性信息。
 */
export interface DbError {
    code: string;
    message: string;
}
export interface DbResult<T> {
    data: T | null;
    error: DbError | null;
}
if (!MONGODB_URL) {
    throw new Error('MongoDB connection string (MONGODB_URL) is not defined in environment variables.');
}
if (!MONGODB_DB_NAME) {
    throw new Error('MongoDB database name (MONGODB_DB_NAME) is not defined in environment variables.');
}

const client = new MongoClient(MONGODB_URL, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbInstance: Db | null = null;

/**
 * 连接数据库,返回数据库单例
 * @returns {Promise<Db>}
 */
export async function connectToDatabase(): Promise<Db> {
    if (dbInstance) {
        return dbInstance;
    }
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        dbInstance = client.db(MONGODB_DB_NAME);
        // 在首次成功连接后，统一确保所有索引
        await ensureIndexes();
        return dbInstance;
    } catch (e) {
        console.error('Failed to connect to MongoDB', e);
        throw new Error('Could not connect to database');
    }
}

/**
 * 返回 MongoClient 实例，主要用于事务处理。
 * @returns {MongoClient}
 */
export function getClient(): MongoClient {
    return client;
}

/**
 * 根据集合名返回一个类型化的集合对象。
 * @template T - 集合文档的 Schema 类型，它必须是一个对象结构。
 * @param {string} COLLECTION_NAME - 集合的名称。
 * @returns {Promise<Collection<T>>}
 */
export async function getCollection<T extends Document>(COLLECTION_NAME: string): Promise<Collection<T>> {
    const db = await connectToDatabase();
    return db.collection<T>(COLLECTION_NAME);
}

/**
 * 确保所有集合的索引都已创建。
 * 在数据库首次连接成功后调用。
 */
export async function ensureIndexes() {
    console.log("Ensuring all database indexes...");
    try {
        // 每个模块负责自己的索引创建逻辑
        await ensureUserIndexes();
        await ensureSessionIndexes();
        await ensureArticleIndexes();
        console.log("All indexes ensured successfully.");
    } catch (error: any) {
        // 集中处理常见的索引创建冲突错误
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
            console.warn(`Warning ensuring indexes: ${error.message}. Index might already exist with different options.`);
        } else if (error.codeName === 'IndexKeySpecsConflict' || error.code === 86) {
            console.warn(`Warning ensuring indexes: ${error.message}. Index might already exist with different key specs.`);
        } else {
            // 对于其他错误，向上抛出以可能中止应用启动
            console.error("A critical error occurred during index creation:", error);
            throw error;
        }
    }
}

// 重新导出 ObjectId 以方便在其他地方使用
export { MongoObjectId as ObjectId };