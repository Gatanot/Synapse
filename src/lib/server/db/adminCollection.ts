/**
 * @fileoverview 管理员集合操作模块
 * @description 提供管理员数据的 CRUD 操作，包括管理员初始化、权限检查等功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection, ObjectId } from './db';
import type { AdminSchema } from '$lib/schema/adminSchema';
import type { UserSchema } from '$lib/schema';
import type { DbResult } from '$lib/schema/db';
import type { InsertOneResult, DeleteResult } from 'mongodb';
import { createUser } from './userCollection';
import bcrypt from 'bcryptjs';

const COLLECTION_NAME = 'admins';

/**
 * 为管理员集合创建必要的索引
 * @description 创建 userId 唯一索引和 priority 索引以优化查询性能
 * @returns {Promise<void>}
 * @throws {Error} 当索引创建失败时抛出错误
 */
export async function ensureAdminIndexes(): Promise<void> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        await adminsCollection.createIndex({ userId: 1 }, { unique: true });
        console.log("Unique index on admins.userId ensured.");
        await adminsCollection.createIndex({ priority: 1 });
        console.log("Index on admins.priority ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 管理员初始化脚本
 * 删除所有admin集合内的数据，并插入一条超级管理员数据
 * @param {string} superAdminUserId - 超级管理员的用户ID
 * @returns {Promise<DbResult<InsertOneResult<AdminSchema>>>} 操作结果
 */
export async function initializeAdmins(superAdminUserId: string): Promise<DbResult<InsertOneResult<AdminSchema>>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const usersCollection = await getCollection<UserSchema>('users');
        
        const userObjectId = new ObjectId(superAdminUserId);
        
        // 检查用户是否存在
        const user = await usersCollection.findOne({ _id: userObjectId });
        if (!user) {
            return {
                data: null,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' }
            };
        }
        
        // 删除所有管理员数据
        await adminsCollection.deleteMany({});
        
        // 插入超级管理员数据
        const currentTime = new Date();
        const newAdmin: Omit<AdminSchema, '_id'> = {
            userId: userObjectId,
            priority: 0, // 超级管理员
            createdAt: currentTime,
            updatedAt: currentTime
        };
        
        const result = await adminsCollection.insertOne(newAdmin as AdminSchema);
        
        return {
            data: result,
            error: null
        };
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'INIT_ADMIN_ERROR', message: error.message }
        };
    }
}

/**
 * 完整的管理员初始化脚本
 * 清除admin集合，创建指定的超级管理员用户（如果不存在），并设置为超级管理员
 * @param {object} superAdminData - 超级管理员数据
 * @param {string} superAdminData.name - 超级管理员姓名
 * @param {string} superAdminData.email - 超级管理员邮箱
 * @param {string} superAdminData.password - 超级管理员密码
 * @param {string} [superAdminData.signature] - 超级管理员个人签名
 * @returns {Promise<DbResult<{ userId: string; adminResult: InsertOneResult<AdminSchema> }>>} 操作结果
 */
export async function initializeAdminsComplete(superAdminData: {
    name: string;
    email: string;
    password: string;
    signature?: string;
}): Promise<DbResult<{ userId: string; adminResult: InsertOneResult<AdminSchema> }>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const usersCollection = await getCollection<UserSchema>('users');
        
        // 1. 清除admin集合中的全部数据
        await adminsCollection.deleteMany({});
        console.log('Admin collection cleared');
        
        // 2. 检查用户是否已存在
        const normalizedEmail = superAdminData.email.trim().toLowerCase();
        let existingUser = await usersCollection.findOne({ email: normalizedEmail });
        
        let userId: string;
        
        if (!existingUser) {
            // 3. 如果用户不存在，创建新用户
            const userResult = await createUser({
                name: superAdminData.name,
                email: superAdminData.email,
                password: superAdminData.password
            });
            
            if (userResult.error) {
                return {
                    data: null,
                    error: { code: 'CREATE_USER_ERROR', message: `Failed to create user: ${userResult.error.message}` }
                };
            }
            
            userId = userResult.data!.insertedId.toString();
            
            // 更新用户的signature字段
            const signature = superAdminData.signature || '系统管理员';
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { signature, updatedAt: new Date() } }
            );
            
            console.log(`Super admin user created with ID: ${userId}`);
        } else {
            // 如果用户已存在，使用现有用户ID
            userId = existingUser._id.toString();
            console.log(`Using existing user with ID: ${userId}`);
        }
        
        // 4. 将用户设置为超级管理员
        const userObjectId = new ObjectId(userId);
        const currentTime = new Date();
        const newAdmin: Omit<AdminSchema, '_id'> = {
            userId: userObjectId,
            priority: 0, // 超级管理员
            createdAt: currentTime,
            updatedAt: currentTime
        };
        
        const adminResult = await adminsCollection.insertOne(newAdmin as AdminSchema);
        
        console.log(`Super admin created successfully with admin ID: ${adminResult.insertedId}`);
        
        return {
            data: { userId, adminResult },
            error: null
        };
        
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'INIT_ADMIN_COMPLETE_ERROR', message: error.message }
        };
    }
}

/**
 * 获取所有管理员数据
 * @returns {Promise<DbResult<AdminSchema[]>>} 所有管理员信息数组
 */
export async function getAllAdmins(): Promise<DbResult<AdminSchema[]>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const admins = await adminsCollection.find({}).sort({ priority: 1, createdAt: -1 }).toArray();
        
        return {
            data: admins,
            error: null
        };
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'GET_ADMINS_ERROR', message: error.message }
        };
    }
}

/**
 * 根据userId获取管理员信息
 * @param {string} userId - 用户ID
 * @returns {Promise<DbResult<AdminSchema | null>>} 管理员数据
 */
export async function getAdminByUserId(userId: string): Promise<DbResult<AdminSchema | null>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const userObjectId = new ObjectId(userId);
        
        const admin = await adminsCollection.findOne({ userId: userObjectId });
        
        return {
            data: admin,
            error: null
        };
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'GET_ADMIN_ERROR', message: error.message }
        };
    }
}

/**
 * 创建新管理员
 * @param {string} userId - 用户ID
 * @param {number} priority - 管理员级别 (0: 超级管理员, 1: 普通管理员)
 * @returns {Promise<DbResult<InsertOneResult<AdminSchema>>>} 操作结果
 */
export async function createAdmin(userId: string, priority: number = 1): Promise<DbResult<InsertOneResult<AdminSchema>>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const usersCollection = await getCollection<UserSchema>('users');
        
        const userObjectId = new ObjectId(userId);
        
        // 检查用户是否存在
        const user = await usersCollection.findOne({ _id: userObjectId });
        if (!user) {
            return {
                data: null,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' }
            };
        }
        
        // 检查是否已经是管理员
        const existingAdmin = await adminsCollection.findOne({ userId: userObjectId });
        if (existingAdmin) {
            return {
                data: null,
                error: { code: 'ADMIN_EXISTS', message: 'User is already an admin' }
            };
        }
        
        const currentTime = new Date();
        const newAdmin: Omit<AdminSchema, '_id'> = {
            userId: userObjectId,
            priority,
            createdAt: currentTime,
            updatedAt: currentTime
        };
        
        const result = await adminsCollection.insertOne(newAdmin as AdminSchema);
        
        return {
            data: result,
            error: null
        };
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'CREATE_ADMIN_ERROR', message: error.message }
        };
    }
}

/**
 * 根据userId删除管理员信息
 * @param {string} userId - 用户ID
 * @returns {Promise<DbResult<DeleteResult>>} 删除结果
 */
export async function deleteAdminByUserId(userId: string): Promise<DbResult<DeleteResult>> {
    try {
        const adminsCollection = await getCollection<AdminSchema>(COLLECTION_NAME);
        const userObjectId = new ObjectId(userId);
        
        const result = await adminsCollection.deleteOne({ userId: userObjectId });
        
        return {
            data: result,
            error: null
        };
    } catch (error: any) {
        return {
            data: null,
            error: { code: 'DELETE_ADMIN_ERROR', message: error.message }
        };
    }
}

/**
 * 检查用户是否为管理员
 * @param {string} userId - 用户ID
 * @returns {Promise<DbResult<boolean>>} 是否为管理员
 */
export async function isAdmin(userId: string): Promise<DbResult<boolean>> {
    try {
        const result = await getAdminByUserId(userId);
        return {
            data: result.data !== null,
            error: null
        };
    } catch (error: any) {
        return {
            data: false,
            error: { code: 'CHECK_ADMIN_ERROR', message: error.message }
        };
    }
}

/**
 * 检查用户是否为超级管理员
 * @param {string} userId - 用户ID
 * @returns {Promise<DbResult<boolean>>} 是否为超级管理员
 */
export async function isSuperAdmin(userId: string): Promise<DbResult<boolean>> {
    try {
        const result = await getAdminByUserId(userId);
        return {
            data: result.data !== null && result.data.priority === 0,
            error: null
        };
    } catch (error: any) {
        return {
            data: false,
            error: { code: 'CHECK_SUPER_ADMIN_ERROR', message: error.message }
        };
    }
}