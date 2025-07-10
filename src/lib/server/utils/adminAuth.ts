/**
 * @fileoverview 管理员权限验证模块
 * @description 提供管理员身份验证和权限检查功能，用于保护管理员专用页面和API
 * @author Synapse Team
 * @since 2025-01-01
 */

import { redirect } from '@sveltejs/kit';
import { getAdminByUserId } from '$lib/server/db/adminCollection';
import type { UserClient } from '$lib/types/client';
import type { AdminClient } from '$lib/types/client';
import type { AdminSchema } from '$lib/schema/adminSchema';

/**
 * 将AdminSchema转换为AdminClient
 * @description 转换数据库管理员对象为客户端安全的序列化格式
 * @param {AdminSchema} admin - 数据库管理员对象
 * @returns {AdminClient} 客户端安全的管理员对象
 */
function convertAdminToClient(admin: AdminSchema): AdminClient {
    return {
        _id: admin._id.toString(),
        userId: admin.userId.toString(),
        priority: admin.priority,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
    };
}

/**
 * 检查用户是否为管理员
 * @description 验证用户管理员身份的中间件函数，用于保护管理员页面
 * @param {UserClient | null} user - 当前用户信息
 * @returns {Promise<AdminClient>} 管理员信息
 * @throws {redirect} 当用户未登录时重定向到登录页，当用户非管理员时重定向到首页
 */
export async function requireAdmin(user: UserClient | null): Promise<AdminClient> {
    if (!user) {
        throw redirect(302, '/login');
    }
    
    const adminResult = await getAdminByUserId(user._id);
    if (adminResult.error || !adminResult.data) {
        throw redirect(302, '/');
    }
    
    return convertAdminToClient(adminResult.data);
}

/**
 * 检查用户是否为超级管理员
 * @description 验证用户超级管理员身份的中间件函数，用于保护超级管理员专用功能
 * @param {UserClient | null} user - 当前用户信息
 * @returns {Promise<AdminClient>} 超级管理员信息
 * @throws {redirect} 当用户不是超级管理员时重定向到管理后台首页
 */
export async function requireSuperAdmin(user: UserClient | null): Promise<AdminClient> {
    const admin = await requireAdmin(user);
    
    // 检查是否为超级管理员
    if (admin.priority !== 0) {
        throw redirect(302, '/');
    }
    
    return admin;
}

/**
 * 检查管理员是否可以删除指定用户
 * @param currentAdmin - 当前管理员信息
 * @param targetUserId - 目标用户ID
 * @returns 是否可以删除该用户
 */
export async function canDeleteUser(currentAdmin: AdminClient, targetUserId: string): Promise<boolean> {
    try {
        // 超级管理员可以删除任何用户
        if (currentAdmin.priority === 0) {
            return true;
        }
        
        // 普通管理员只能删除非管理员用户
        if (currentAdmin.priority === 1) {
            // 检查目标用户是否为管理员
            const targetAdminResult = await getAdminByUserId(targetUserId);
            
            // 如果目标用户不是管理员，则可以删除
            return targetAdminResult.error !== null || targetAdminResult.data === null;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking delete user permission:', error);
        return false;
    }
}