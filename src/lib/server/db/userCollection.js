import { getCollection, ObjectId } from './db';
const COLLECTION_NAME = 'users';


/**
 * 创建新用户
 * @param {object} userData
 * @returns {Promise<import('mongodb').InsertOneResult | null>}
 */
export async function createUser(userData) {
    if (!userData || typeof userData !== 'object') {
        const message = 'Create user failed: userData is not a valid object or not provided.';
        console.warn(message);
        return { error: 'INVALID_INPUT', message };
    }
    const keys = Object.keys(userData);
    if (keys.length === 0) {
        const message = 'Create user failed: userData is an empty object.';
        console.warn(message);
        return { error: 'INVALID_INPUT', message };
    }
    // 2. 校验 userData 的所有自有属性值
    for (const key of keys) {
        const value = userData[key];
        if (value === null || value === undefined) {
            const message = `Create user failed: Required field '${key}' in userData is null or undefined.`;
            console.warn(message);
            return { error: 'VALIDATION_ERROR', message };
        }
        if (typeof value === 'string' && value.trim() === '') {
            const message = `Create user failed: Required field '${key}' in userData is an empty string.`;
            console.warn(message);
            return { error: 'VALIDATION_ERROR', message };
        }
    }
    // 3. 特别校验 email 字段是否存在、类型和格式
    // trim() 用于去除前后空格后再校验
    const email = userData.email ? String(userData.email).trim() : null;

    if (!email) { // 包含了 userData.email 为空字符串、null、undefined的情况
        const message = 'Create user failed: Email field is missing, empty, or invalid in userData.';
        console.warn(message);
        return { error: 'VALIDATION_ERROR', message };
    }
    // 简单的 email 格式校验正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const message = `Create user failed: Invalid email format for '${email}'.`;
        console.warn(message);
        return { error: 'VALIDATION_ERROR', message };
    }
    try {
        const collection = await getCollection(COLLECTION_NAME);

        // 4. 检查 email 是否已存在
        const existingUser = await collection.findOne({ email: email }); // 使用 trim 后的 email 查询
        if (existingUser) {
            const message = `Create user failed: Email '${email}' already exists.`;
            console.warn(message);
            return { error: 'EMAIL_EXISTS', message };
        }

        const dataToInsert = {
            ...userData,
            email: email, // 使用处理过的 email
            articles: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(dataToInsert);
        return result; // 成功时返回 InsertOneResult

    } catch (error) {
        const message = `Error during createUser operation for email ${email}: ${error.message}`;
        console.error(message, error); // 记录完整错误栈
        return { error: 'DB_ERROR', message: 'An unexpected error occurred while creating the user.' }; // 对外可以隐藏具体错误细节
    }
}
/**
 * 根据邮箱地址查找用户
 * @param {string} email - 要查找的用户的邮箱地址
 * @returns {Promise<object | null | { error: string, message: string }>}
 *          如果找到用户，则返回用户文档对象
 *          如果未找到用户，则返回 null。
 *          如果发生错误，则返回一个包含错误信息的对象。
 */
export async function findUserByEmail(email) {
    if (!email || typeof email !== 'string' || email.trim() === '') {
        const message = 'Find user by email failed: Email parameter is missing or invalid.';
        console.warn(message);
        return { error: 'INVALID_INPUT', message };
    }

    // 规范化 email (与 createUser 时存储的方式一致)
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        const message = `Find user by email failed: Invalid email format for '${normalizedEmail}'.`;
        console.warn(message);
        return { error: 'VALIDATION_ERROR', message };
    }

    try {
        const collection = await getCollection(COLLECTION_NAME);
        const user = await collection.findOne({ email: normalizedEmail });

        if (user) {
            return user;
        } else {
            return null; // 用户未找到
        }
    } catch (error) {
        const message = `Error finding user by email '${normalizedEmail}': ${error.message}`;
        console.error(message, error);
        return { error: 'DB_ERROR', message: 'An unexpected error occurred while fetching the user.' };
    }
}


/**
 * 根据用户ID查找用户
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findUserById(userId) {
    if (!userId || !ObjectId.isValid(userId)) { // 检查ID是否有效
        return null;
    }
    const usersCollection = await getCollection(COLLECTION_NAME);
    // 注意：MongoDB _id 字段通常是 ObjectId 类型，需要转换
    return await usersCollection.findOne({ _id: new ObjectId(userId) });
}

/**
 * Deletes a user by their ID.
 * @param {string} id - The user's ID.
 * @returns {Promise<import('mongodb').DeleteResult | { error: string, message: string }>}
 *          成功时返回 DeleteResult，失败时返回包含错误信息的对象。
 */
export async function deleteUser(id) {
    if (!id || !ObjectId.isValid(id)) {
        const message = `Invalid ObjectId format for user ID: ${id}`;
        console.warn(message);
        return { error: 'INVALID_ID', message };
    }
    try {
        const collection = await getCollection(COLLECTION_NAME);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            const message = `User with ID '${id}' not found for deletion.`;
            console.warn(message);
            return { error: 'NOT_FOUND', message };
        }
        return result;

    } catch (error) {
        const message = `Error deleting user ${id}: ${error.message}`;
        console.error(message, error);
        return { error: 'DB_ERROR', message: 'An unexpected error occurred while deleting the user.' };
    }
}
