import { redirect } from '@sveltejs/kit';
import { getAdminByUserId } from '$lib/server/db/adminCollection';
import type { UserClient } from '$lib/types/client';
import type { AdminClient } from '$lib/types/client';
import type { AdminSchema } from '$lib/schema/adminSchema';

/**
 * 将 AdminSchema 转换为 AdminClient（序列化安全）
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
 * 检查用户是否为管理员的中间件函数
 * @param user - 当前用户信息
 * @returns 管理员信息或抛出重定向错误
 */
export async function requireAdmin(user: UserClient | null): Promise<AdminClient> {
    // 检查用户是否已登录
    if (!user) {
        throw redirect(302, '/login');
    }
    
    // 检查用户是否为管理员
    const adminResult = await getAdminByUserId(user._id);
    if (adminResult.error || !adminResult.data) {
        // 用户不是管理员，重定向到首页
        throw redirect(302, '/');
    }
    
    // 转换为客户端安全的类型
    return convertAdminToClient(adminResult.data);
}

/**
 * 检查用户是否为超级管理员的中间件函数
 * @param user - 当前用户信息
 * @returns 超级管理员信息或抛出重定向错误
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