import { requireSuperAdmin } from '$lib/server/utils/adminAuth';
import { getAllAdmins, deleteAdminByUserId, createAdmin } from '$lib/server/db/adminCollection';
import { findUserByEmail, findUserById } from '$lib/server/db/userCollection';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminClient, UserClient } from '$lib/types/client';

// 管理员和用户信息的组合类型
interface AdminWithUser {
    admin: AdminClient;
    user: UserClient | null;
}

export const load: PageServerLoad = async ({ locals }) => {
    // 只有超级管理员可以访问此页面
    const admin = await requireSuperAdmin(locals.user);
    
    try {
        // 获取所有管理员信息
        const adminsResult = await getAllAdmins();
        
        if (adminsResult.error) {
            throw new Error(adminsResult.error.message);
        }
        
        // 转换为客户端安全的类型并过滤出普通管理员
        const allAdmins = adminsResult.data || [];
        const regularAdmins = allAdmins.filter(admin => admin.priority === 1);
        
        // 获取每个管理员对应的用户信息
        const adminWithUsers: AdminWithUser[] = await Promise.all(
            regularAdmins.map(async (adminData) => {
                const userResult = await findUserById(adminData.userId.toString());
                
                const adminClient: AdminClient = {
                    _id: adminData._id.toString(),
                    userId: adminData.userId.toString(),
                    priority: adminData.priority,
                    createdAt: adminData.createdAt,
                    updatedAt: adminData.updatedAt
                };
                
                const userClient: UserClient | null = userResult.data ? {
                    _id: userResult.data._id.toString(),
                    name: userResult.data.name,
                    email: userResult.data.email,
                    articles: userResult.data.articles.map(id => id.toString()),
                    createdAt: userResult.data.createdAt,
                    updatedAt: userResult.data.updatedAt,
                    likes: userResult.data.likes.map(id => id.toString()),
                    signature: userResult.data.signature
                } : null;
                
                return { admin: adminClient, user: userClient };
            })
        );
        
        return {
            admin,
            adminWithUsers
        };
    } catch (error) {
        console.error('Error loading admin edit page:', error);
        throw redirect(302, '/admin');
    }
};

export const actions: Actions = {
    // 删除普通管理员
    deleteAdmin: async ({ request, locals }) => {
        const admin = await requireSuperAdmin(locals.user);
        
        const formData = await request.formData();
        const adminId = formData.get('adminId') as string;
        
        if (!adminId) {
            return fail(400, { error: '缺少管理员ID' });
        }
        
        try {
            const result = await deleteAdminByUserId(adminId);
            
            if (result.error) {
                return fail(400, { error: result.error.message });
            }
            
            if (result.data && result.data.deletedCount === 0) {
                return fail(404, { error: '管理员不存在' });
            }
            
            return { success: true, message: '管理员删除成功' };
        } catch (error: any) {
            return fail(500, { error: '删除管理员失败: ' + error.message });
        }
    },
    
    // 添加新的普通管理员
    addAdmin: async ({ request, locals }) => {
        const admin = await requireSuperAdmin(locals.user);
        
        const formData = await request.formData();
        const identifier = formData.get('identifier') as string;
        
        if (!identifier) {
            return fail(400, { error: '请输入用户邮箱或ID' });
        }
        
        try {
            let userId: string;
            
            // 检查输入的是邮箱还是ID
            if (identifier.includes('@')) {
                // 通过邮箱查找用户
                const userResult = await findUserByEmail(identifier);
                if (userResult.error || !userResult.data) {
                    return fail(404, { error: '用户不存在' });
                }
                userId = userResult.data._id.toString();
            } else {
                // 通过ID查找用户
                const userResult = await findUserById(identifier);
                if (userResult.error || !userResult.data) {
                    return fail(404, { error: '用户不存在' });
                }
                userId = identifier;
            }
            
            // 创建普通管理员 (priority: 1)
            const result = await createAdmin(userId, 1);
            
            if (result.error) {
                if (result.error.code === 'ADMIN_EXISTS') {
                    return fail(400, { error: '该用户已经是管理员' });
                }
                return fail(400, { error: result.error.message });
            }
            
            return { success: true, message: '管理员添加成功' };
        } catch (error: any) {
            return fail(500, { error: '添加管理员失败: ' + error.message });
        }
    }
};