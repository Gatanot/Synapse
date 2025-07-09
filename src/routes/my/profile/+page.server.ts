import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { updateUserProfile, findUserById } from '$lib/server/db/userCollection';
import type { UserClient } from '$lib/types/client';

/**
 * 加载用户资料页面数据
 */
export const load: PageServerLoad = async ({ locals }) => {
    // 检查用户是否已登录
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    // 获取完整的用户信息
    const userResult = await findUserById(locals.user._id);
    
    if (userResult.error || !userResult.data) {
        console.error('Failed to load user profile:', userResult.error);
        throw redirect(302, '/login');
    }

    // 转换为客户端类型
    const userProfile: UserClient = {
        _id: userResult.data._id.toString(),
        name: userResult.data.name,
        email: userResult.data.email,
        articles: userResult.data.articles.map(id => id.toString()),
        likes: Array.isArray(userResult.data.likes) ? userResult.data.likes.map(id => id.toString()) : [],
        signature: userResult.data.signature || ''
    };

    return {
        user: userProfile
    };
};

/**
 * 处理表单操作
 */
export const actions: Actions = {
    /**
     * 更新用户资料
     */
    updateProfile: async ({ request, locals }) => {
        // 检查用户是否已登录
        if (!locals.user) {
            return fail(401, { error: '未授权访问' });
        }

        const formData = await request.formData();
        const name = formData.get('name')?.toString()?.trim();
        const signature = formData.get('signature')?.toString() ?? '';

        // 验证输入
        if (!name) {
            return fail(400, {
                error: '用户名是必填项',
                name,
                signature
            });
        }

        if (name.length < 2) {
            return fail(400, {
                error: '用户名至少需要2个字符',
                name,
                signature
            });
        }

        if (name.length > 50) {
            return fail(400, {
                error: '用户名不能超过50个字符',
                name,
                signature
            });
        }

        if (signature.length > 100) {
            return fail(400, {
                error: '签名不能超过100个字符',
                name,
                signature
            });
        }

        try {
            // 更新用户名和签名
            const updateResult = await updateUserProfile(locals.user._id, {
                name,
                signature
            });

            if (updateResult.error) {
                console.error('Profile update failed:', updateResult.error);
                let errorMessage = '更新失败，请稍后重试';
                return fail(400, {
                    error: errorMessage,
                    name,
                    signature
                });
            }

            // 更新本地会话中的用户信息
            if (locals.user) {
                locals.user.name = name;
                locals.user.signature = signature;
            }

            // 重新获取最新的用户数据以确保数据同步
            const updatedUserResult = await findUserById(locals.user._id);
            if (updatedUserResult.data) {
                locals.user.name = updatedUserResult.data.name;
                locals.user.signature = updatedUserResult.data.signature || '';
            }

            return {
                success: true,
                message: '资料更新成功'
            };

        } catch (error) {
            console.error('Unexpected error during profile update:', error);
            return fail(500, {
                error: '服务器内部错误，请稍后重试',
                name,
                signature
            });
        }
    }
};
