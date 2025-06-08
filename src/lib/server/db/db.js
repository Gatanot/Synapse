import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';
import { ensureArticleIndexes } from './articleCollection';
import { ensureSessionIndexes } from './sessionCollection';
import { ensureUserIndexes } from './userCollection';
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
let dbInstance = null;
/**
 * 返回 MongoClient 实例。主要用于启动事务。
 * @returns {import('mongodb').MongoClient}
 */
export function getClient() {
    return client;
}
/**
 * 连接数据库,返回数据库单例
 * @returns {Promise<import('mongodb').Db>}
 */
export async function connectToDatabase() {
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
 * 根据集合名返回集合
 */
export async function getCollection(COLLECTION_NAME) {
    const db = await connectToDatabase();
    return db.collection(COLLECTION_NAME);
}

/**
 * 协调所有集合的索引创建过程。
 * 这个函数在应用启动时被调用一次。
 */
export async function ensureIndexes() {
    console.log("Ensuring all database indexes...");
    try {
        // 按顺序调用每个集合的索引创建函数
        await ensureUserIndexes();
        await ensureSessionIndexes();
        await ensureArticleIndexes();
        console.log("All indexes have been successfully checked/created.");
    } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
            console.warn(`Warning ensuring indexes: ${error.message}. An index might already exist with different options.`);
        } else if (error.codeName === 'IndexKeySpecsConflict' || error.code === 86) {
            console.warn(`Warning ensuring indexes: ${error.message}. An index might already exist with a different key specification.`);
        }
        else {
            console.error("Fatal error during index creation:", error);
            // 在启动阶段，如果索引创建失败，必须抛出错误以终止进程
            throw error;
        }
    }
}
export { ObjectId } from 'mongodb';