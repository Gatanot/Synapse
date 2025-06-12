import { getCollection, ObjectId } from './db';
import type { UserSchema, DbResult } from '$lib/schema';
import type { UserRegisterShare } from '$lib/types/share';
import type { InsertOneResult, UpdateResult, ClientSession, UpdateFilter, DeleteResult } from 'mongodb';
import bcrypt from 'bcryptjs';
const COLLECTION_NAME = 'users';

/**
 * 为 users 集合创建必要的索引。
 */
export async function ensureUserIndexes(): Promise<void> {
    try {
        const usersCollection = await getCollection<UserSchema>(COLLECTION_NAME);
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("Unique index on users.email ensured.");
    } catch (error) {
        throw error; // 错误由中心的 ensureIndexes 函数处理
    }
}
/**
 * 创建新用户。该函数期望接收已处理好的数据（例如，密码已哈希）。
 * @param {UserRegisterShare} userData - 要创建的用户数据，不包含数据库生成的字段。
 * @returns {Promise<DbResult<InsertOneResult<UserSchema>>>}
 */
export async function createUser(userData: UserRegisterShare): Promise<DbResult<InsertOneResult<UserSchema>>> {

    const normalizedEmail = userData.email.trim().toLowerCase();

    try {
        const collection = await getCollection<UserSchema>(COLLECTION_NAME);

        const existingUser = await collection.findOne({ email: normalizedEmail });
        if (existingUser) {
            const message = `Create user failed: Email '${normalizedEmail}' already exists.`;
            console.warn(message);
            return { data: null, error: { code: 'EMAIL_EXISTS', message } };
        }

        // --- 密码哈希逻辑更新 ---
        // 使用 bcrypt.hash 自动生成盐并哈希密码
        const hashedPassword = await bcrypt.hash(userData.password, 10); // 10 是 cost factor，推荐值

        const dataToInsert: Omit<UserSchema, '_id'> = {
            name: userData.name,
            email: normalizedEmail,
            password: hashedPassword, // <--- 存储哈希后的密码
            articles: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // ------------------------

        const result = await collection.insertOne(dataToInsert as UserSchema);
        return { data: result, error: null };

    } catch (error: any) {
        const message = `An unexpected error occurred while creating the user.`;
        console.error(`Error during createUser for email ${normalizedEmail}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}
/**
 * 根据邮箱地址查找用户 (不区分大小写)。
 * @param {string} email - 要查找的用户的邮箱地址
 * @returns {Promise<DbResult<UserSchema | null>>}
 */
export async function findUserByEmail(email: string): Promise<DbResult<UserSchema | null>> {
    if (!email || typeof email !== 'string' || email.trim() === '') {
        const message = 'Find user by email failed: Email parameter is missing or invalid.';
        console.warn(message);
        return { data: null, error: { code: 'INVALID_INPUT', message } };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        const message = `Find user by email failed: Invalid email format for '${normalizedEmail}'.`;
        console.warn(message);
        return { data: null, error: { code: 'VALIDATION_ERROR', message } };
    }

    try {
        const collection = await getCollection<UserSchema>(COLLECTION_NAME);
        const user = await collection.findOne({ email: normalizedEmail });
        // 找到或没找到都是成功查询, 只是 data 可能为 null
        return { data: user, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while fetching the user.';
        console.error(`Error finding user by email '${normalizedEmail}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}


/**
 * 根据用户ID查找用户。
 * @param {string} userId
 * @returns {Promise<DbResult<UserSchema | null>>}
 */
export async function findUserById(userId: string): Promise<DbResult<UserSchema | null>> {
    if (!userId || !ObjectId.isValid(userId)) {
        const message = `Invalid ObjectId format for user ID: ${userId}`;
        console.warn(message);
        return { data: null, error: { code: 'INVALID_ID', message } };
    }
    try {
        const usersCollection = await getCollection<UserSchema>(COLLECTION_NAME);
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        return { data: user, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while fetching the user by ID.';
        console.error(`Error finding user by ID '${userId}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据ID删除用户。
 * @param {string} id - 用户的ID。
 * @returns {Promise<DbResult<DeleteResult>>}
 */
export async function deleteUser(id: any): Promise<DbResult<DeleteResult>> {
    if (!id || !ObjectId.isValid(id)) {
        const message = `Invalid ObjectId format for user ID: ${id}`;
        console.warn(message);
        return { data: null, error: { code: 'INVALID_ID', message } };
    }
    try {
        const collection = await getCollection(COLLECTION_NAME);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            const message = `User with ID '${id}' not found for deletion.`;
            console.warn(message);
            return { data: null, error: { code: 'NOT_FOUND', message } };
        }
        return { data: result, error: null };

    } catch (error: any) {
        const message = 'An unexpected error occurred while deleting the user.';
        console.error(`Error deleting user ${id}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}
/**
 * 将一篇文章的 ID 添加到用户的 articles 数组中。
 * 此函数设计为可以在事务中运行。
 * @param {ObjectId} userId - 用户的 ObjectId。
 * @param {ObjectId} articleId - 要添加的文章的 ObjectId。
 * @param {object} [options={}] - 选项对象。
 * @param {import('mongodb').ClientSession} [options.session] - 用于事务的会话对象。
 * @returns {Promise<UpdateResult>}
 */
export async function addArticleToUser(
    userId: ObjectId,
    articleId: ObjectId,
    options: { session?: ClientSession } = {}
): Promise<UpdateResult> {
    const { session } = options;
    const usersCollection = await getCollection<UserSchema>(COLLECTION_NAME);

    // 2. 定义更新操作，并使用类型断言
    const updateQuery: UpdateFilter<UserSchema> = {
        $push: {
            articles: articleId,
        },
    };

    const result = await usersCollection.updateOne(
        { _id: userId }, // 过滤器
        updateQuery,    // 更新操作
        { session }     // 选项
    );

    if (result.matchedCount === 0) {
        throw new Error(`User with ID ${userId} not found, cannot add article.`);
    }

    return result;
}

