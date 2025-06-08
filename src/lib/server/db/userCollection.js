import { getCollection, ObjectId } from './db';
const COLLECTION_NAME = 'users';
/**
 * 为 users 集合创建必要的索引。
 */
export async function ensureUserIndexes() {
    try {
        const usersCollection = await getCollection(COLLECTION_NAME);
        await usersCollection.createIndex(
            { email: 1 },
            { unique: true }
        );
        console.log("Unique index on users.email ensured.");
    } catch (error) {
        // 将错误向上抛出，由中心的 ensureIndexes 函数处理
        throw error;
    }
}
/**
 * 创建新用户，邮箱地址会被转换为小写存储。
 * @param {object} userData
 * @returns {Promise<{data: import('mongodb').InsertOneResult | null, error: {code: string, message: string} | null}>}
 */
export async function createUser(userData) {
    if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
        const message = 'Create user failed: userData must be a non-empty object.';
        console.warn(message);
        return { data: null, error: { code: 'INVALID_INPUT', message } };
    }

    // 校验必填字段
    for (const key of Object.keys(userData)) {
        const value = userData[key];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            const message = `Create user failed: Field '${key}' in userData cannot be null, undefined, or empty.`;
            console.warn(message);
            return { data: null, error: { code: 'VALIDATION_ERROR', message } };
        }
    }

    // 统一将 email 转换为小写并校验
    const email = userData.email ? String(userData.email).trim().toLowerCase() : null;

    if (!email) {
        const message = 'Create user failed: Email field is missing or empty in userData.';
        console.warn(message);
        return { data: null, error: { code: 'VALIDATION_ERROR', message } };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const message = `Create user failed: Invalid email format for '${email}'.`;
        console.warn(message);
        return { data: null, error: { code: 'VALIDATION_ERROR', message } };
    }

    try {
        const collection = await getCollection(COLLECTION_NAME);

        // 检查 email 是否已存在 (使用小写后的 email 查询)
        const existingUser = await collection.findOne({ email: email });
        if (existingUser) {
            const message = `Create user failed: Email '${email}' already exists.`;
            console.warn(message);
            return { data: null, error: { code: 'EMAIL_EXISTS', message } };
        }

        const dataToInsert = {
            ...userData,
            email: email, // 使用处理过的小写 email
            articles: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(dataToInsert);
        return { data: result, error: null };

    } catch (error) {
        const message = `An unexpected error occurred while creating the user.`;
        console.error(`Error during createUser operation for email ${email}: ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}
/**
 * 根据邮箱地址查找用户 (不区分大小写)。
 * @param {string} email - 要查找的用户的邮箱地址
 * @returns {Promise<{data: object | null, error: {code: string, message: string} | null}>}
 */
export async function findUserByEmail(email) {
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
        const collection = await getCollection(COLLECTION_NAME);
        const user = await collection.findOne({ email: normalizedEmail });
        // 找到或没找到都是成功查询, 只是 data 可能为 null
        return { data: user, error: null };
    } catch (error) {
        const message = 'An unexpected error occurred while fetching the user.';
        console.error(`Error finding user by email '${normalizedEmail}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}


/**
 * 根据用户ID查找用户。
 * @param {string} userId
 * @returns {Promise<{data: object | null, error: {code: string, message: string} | null}>}
 */
export async function findUserById(userId) {
    if (!userId || !ObjectId.isValid(userId)) {
        const message = `Invalid ObjectId format for user ID: ${userId}`;
        console.warn(message);
        return { data: null, error: { code: 'INVALID_ID', message } };
    }
    try {
        const usersCollection = await getCollection(COLLECTION_NAME);
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        return { data: user, error: null };
    } catch (error) {
        const message = 'An unexpected error occurred while fetching the user by ID.';
        console.error(`Error finding user by ID '${userId}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据ID删除用户。
 * @param {string} id - 用户的ID。
 * @returns {Promise<{data: import('mongodb').DeleteResult | null, error: {code: string, message: string} | null}>}
 */
export async function deleteUser(id) {
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

    } catch (error) {
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
 * @returns {Promise<import('mongodb').UpdateResult>}
 */
export async function addArticleToUser(userId, articleId, { session } = {}) {
    const usersCollection = await getCollection(COLLECTION_NAME);

    // 使用 $push 操作符将 articleId 添加到 articles 数组
    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { articles: new ObjectId(articleId) } },
        { session } // 将会话传递给 updateOne 操作
    );

    if (result.matchedCount === 0) {
        // 如果没有找到用户，抛出错误，这将导致事务回滚
        throw new Error(`User with ID ${userId} not found, cannot add article.`);
    }

    return result;
}