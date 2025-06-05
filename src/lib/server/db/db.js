import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';
import { ensureArticleIndexes } from './articleCollection';
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
 * 检查集合索引
 * Call this function after a successful connection.
 */
export async function ensureIndexes() {
    try {
        const db = await connectToDatabase(); // 获取数据库实例
        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("Unique index on users.email ensured.")
        const sessions = await getCollection('sessions');
        // 创建 TTL 索引，MongoDB 会每隔一段时间自动删除 expiresAt 时间已过的文档
        // `expireAfterSeconds: 0` 表示文档在 expiresAt 指定的时间点立即过期
        await sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
        console.log("TTL index on sessions.expiresAt ensured.");
        await ensureArticleIndexes();
    } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
            // 索引已存在但选项不同，或者索引已存在且不能修改 (旧版驱动可能报 code 85)
            console.warn(`Warning ensuring indexes: ${error.message}. Index might already exist with different options or is unchanged.`);
        } else if (error.codeName === 'IndexKeySpecsConflict' || error.code === 86) {
            // 索引已存在但键规格不同
            console.warn(`Warning ensuring indexes: ${error.message}. Index might already exist with different key specs.`);
        }
        else {
            console.error("Error ensuring indexes:", error);
        }
    }
}
export { ObjectId } from 'mongodb';