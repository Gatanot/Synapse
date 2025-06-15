import { MongoClient, ServerApiVersion, Db, Collection, ObjectId as MongoObjectId, type Document } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';
/**
 *   代表数据库操作中结构化的错误对象。
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

// 重新导出 ObjectId 以方便在其他地方使用
export { MongoObjectId as ObjectId };