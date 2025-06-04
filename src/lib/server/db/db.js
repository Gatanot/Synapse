import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_URL, MONGODB_DB_NAME } from '$env/static/private';
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
 * 检查集合索引
 * Call this function after a successful connection.
 */
export async function ensureIndexes() {
    try {
        const db = await connectToDatabase(); // 获取数据库实例

        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("Unique index on users.email ensured.")

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