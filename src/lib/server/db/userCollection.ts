/**
 * @fileoverview 用户集合数据库操作模块
 * @description 提供用户相关的数据库CRUD操作，包括用户创建、查询、更新和删除功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection, ObjectId } from './db';
import type { UserSchema, DbResult } from '$lib/schema';
import type { UserRegisterShare } from '$lib/types/share';
import type { InsertOneResult, UpdateResult, ClientSession, UpdateFilter, DeleteResult } from 'mongodb';
import bcrypt from 'bcryptjs';

const COLLECTION_NAME = 'users';

/**
 * 为用户集合创建必要的索引
 * @description 确保用户邮箱字段的唯一性索引，防止重复邮箱注册
 * @throws {Error} 当索引创建失败时抛出错误
 */
export async function ensureUserIndexes(): Promise<void> {
    try {
        const usersCollection = await getCollection<UserSchema>(COLLECTION_NAME);
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log("Unique index on users.email ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 创建新用户
 * @description 创建新用户账户，包括邮箱唯一性验证和密码哈希处理
 * @param {UserRegisterShare} userData - 用户注册数据，包含姓名、邮箱和密码
 * @returns {Promise<DbResult<InsertOneResult<UserSchema>>>} 数据库操作结果
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
            signature: '', // 个人签名，默认为空字符串
            email: normalizedEmail,
            password: hashedPassword,
            articles: [],
            likes: [], // 新增，初始化 likes 字段
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
/**
 * 根据邮箱查找用户
 * @description 通过邮箱地址查找用户，包含邮箱格式验证和规范化处理
 * @param {string} email - 用户邮箱地址
 * @returns {Promise<DbResult<UserSchema | null>>} 查询结果，找到用户或null
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
        return { data: user, error: null };
    } catch (error: any) {
        const message = 'An unexpected error occurred while fetching the user.';
        console.error(`Error finding user by email '${normalizedEmail}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 根据用户ID查找用户
 * @description 通过ObjectId查找指定用户，包含ID格式验证
 * @param {string} userId - 用户ObjectId字符串
 * @returns {Promise<DbResult<UserSchema | null>>} 查询结果，找到用户或null
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
/**
 * 删除指定用户
 * @description 根据用户ID删除用户记录，包含ID格式验证
 * @param {any} id - 用户ID（ObjectId或字符串格式）
 * @returns {Promise<DbResult<DeleteResult>>} 删除操作结果
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
 * 将文章ID添加到用户的文章数组中
 * @description 更新用户的articles字段，支持事务操作
 * @param {ObjectId} userId - 用户的ObjectId
 * @param {ObjectId} articleId - 要添加的文章ObjectId
 * @param {object} [options={}] - 选项配置
 * @param {ClientSession} [options.session] - 事务会话对象
 * @returns {Promise<UpdateResult>} 更新操作结果
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

/**
 * 从用户的 likes 数组中移除文章 ID。
 * 此函数设计为可以在事务中运行。
 * @param {ObjectId} userId - 用户的 ObjectId。
 * @param {ObjectId} articleId - 要移除的文章的 ObjectId。
 * @param {object} [options={}] - 选项对象。
 * @param {import('mongodb').ClientSession} [options.session] - 用于事务的会话对象。
 * @returns {Promise<UpdateResult>}
 */
export async function removeArticleFromUserLikes(
    userId: ObjectId,
    articleId: ObjectId,
    options: { session?: ClientSession } = {}
): Promise<UpdateResult> {
    const { session } = options;
    const usersCollection = await getCollection<UserSchema>(COLLECTION_NAME);

    const updateQuery: UpdateFilter<UserSchema> = {
        $pull: {
            likes: articleId,
        },
    };

    const result = await usersCollection.updateOne(
        { _id: userId }, // 过滤器
        updateQuery,    // 更新操作
        { session }     // 选项
    );

    return result;
}

/**
/**
 * 更新用户基本信息
 * @description 更新用户的姓名、邮箱和个人签名等基本信息
 * @param {string} userId - 用户ID
 * @param {object} updateData - 要更新的数据
 * @param {string} [updateData.name] - 新的用户姓名
 * @param {string} [updateData.email] - 新的邮箱地址
 * @param {string} [updateData.signature] - 新的个人签名
 * @returns {Promise<DbResult<UpdateResult>>} 更新操作结果
 */
export async function updateUserProfile(
    userId: string,
    updateData: { name?: string; email?: string; signature?: string }
): Promise<DbResult<UpdateResult>> {
    if (!userId || !ObjectId.isValid(userId)) {
        const message = `Invalid ObjectId format for user ID: ${userId}`;
        console.warn(message);
        return { data: null, error: { code: 'INVALID_ID', message } };
    }

    if (!updateData.name && !updateData.email && !updateData.signature) {
        const message = 'No update data provided.';
        console.warn(message);
        return { data: null, error: { code: 'INVALID_INPUT', message } };
    }

    try {
        const collection = await getCollection<UserSchema>(COLLECTION_NAME);

        // 构建更新对象

        const updateFields: Partial<UserSchema> = {
            updatedAt: new Date()
        };

        if (updateData.name) {
            updateFields.name = updateData.name.trim();
        }

        if (updateData.email) {
            const normalizedEmail = updateData.email.trim().toLowerCase();
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                const message = `Invalid email format: ${updateData.email}`;
                console.warn(message);
                return { data: null, error: { code: 'VALIDATION_ERROR', message } };
            }
            // 检查邮箱是否已被其他用户使用
            const existingUser = await collection.findOne({
                email: normalizedEmail,
                _id: { $ne: new ObjectId(userId) }
            });
            if (existingUser) {
                const message = `Email '${normalizedEmail}' is already in use by another user.`;
                console.warn(message);
                return { data: null, error: { code: 'EMAIL_EXISTS', message } };
            }
            updateFields.email = normalizedEmail;
        }

        if (updateData.signature) {
            // 允许 signature 为空字符串
            updateFields.signature = (updateData.signature ?? '').toString();
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            const message = `User with ID '${userId}' not found.`;
            console.warn(message);
            return { data: null, error: { code: 'NOT_FOUND', message } };
        }

        return { data: result, error: null };

    } catch (error: any) {
        const message = 'An unexpected error occurred while updating user profile.';
        console.error(`Error updating user profile for ID '${userId}': ${error.message}`, error);
        return { data: null, error: { code: 'DB_ERROR', message } };
    }
}

/**
 * 获取所有用户（分页），用于管理员查看用户列表
 * @param {object} options - 查询选项
 * @param {number} [options.page=1] - 页码
 * @param {number} [options.limit=20] - 每页数量
 * @param {string} [options.search] - 搜索关键词（用户名或邮箱）
 * @param {string} [options.sortBy='createdAt'] - 排序字段
 * @param {string} [options.sortOrder='desc'] - 排序方向
 * @returns {Promise<DbResult<{ users: UserSchema[], total: number }>>}
 */
export async function getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
} = {}): Promise<DbResult<{ users: UserSchema[], total: number }>> {
    const {
        page = 1,
        limit = 20,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    try {
        const collection = await getCollection<UserSchema>(COLLECTION_NAME);
        
        // 构建查询条件
        const query: any = {};
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];
        }

        // 构建排序条件
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // 计算跳过的文档数
        const skip = (page - 1) * limit;

        // 并行执行查询和计数
        const [users, total] = await Promise.all([
            collection.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments(query)
        ]);

        return {
            data: { users, total },
            error: null
        };
    } catch (error: any) {
        const message = 'An unexpected error occurred while fetching users.';
        console.error(`Error getting all users: ${error.message}`, error);
        return {
            data: null,
            error: { code: 'DB_ERROR', message }
        };
    }
}

/**
 * 获取最近更新的用户列表
 * @param {object} options - 查询选项
 * @param {number} [options.limit=50] - 返回数量限制
 * @param {number} [options.hours=24] - 多少小时内的更新
 * @returns {Promise<DbResult<UserSchema[]>>}
 */
export async function getRecentlyUpdatedUsers(options: {
    limit?: number;
    hours?: number;
} = {}): Promise<DbResult<UserSchema[]>> {
    const { limit = 50, hours = 24 } = options;

    try {
        const collection = await getCollection<UserSchema>(COLLECTION_NAME);
        
        // 计算时间范围
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - hours);

        const users = await collection.find({
            $or: [
                { createdAt: { $gte: timeThreshold } },
                { updatedAt: { $gte: timeThreshold } }
            ]
        })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

        return {
            data: users,
            error: null
        };
    } catch (error: any) {
        const message = 'An unexpected error occurred while fetching recently updated users.';
        console.error(`Error getting recently updated users: ${error.message}`, error);
        return {
            data: null,
            error: { code: 'DB_ERROR', message }
        };
    }
}

