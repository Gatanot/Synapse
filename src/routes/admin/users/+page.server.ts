import { requireAdmin, canDeleteUser } from '$lib/server/utils/adminAuth';
import { getAllUsers, getRecentlyUpdatedUsers, findUserById, deleteUser } from '$lib/server/db/userCollection';
import { getAdminByUserId } from '$lib/server/db/adminCollection';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { UserClient } from '$lib/types/client';

export const load: PageServerLoad = async ({ locals, url }) => {
    try {
        // 只有管理员可以访问此页面
        const admin = await requireAdmin(locals.user);
        
        const searchId = url.searchParams.get('id');
        const filter = url.searchParams.get('filter') || 'all'; // 新增筛选参数：all, recent, admins, users
        let users: (UserClient & { isAdmin: boolean; adminPriority?: number })[] = [];
        let searchedUser: (UserClient & { isAdmin: boolean; adminPriority?: number }) | null = null;
        let searchError: string | null = null;
        
        console.log('Loading admin users page:', { searchId, filter });
        
        if (searchId) {
            // 如果有搜索ID，则搜索特定用户
            console.log('Searching for user:', searchId);
            const { data: user, error } = await findUserById(searchId);
            if (error) {
                console.error('Error finding user by ID:', error);
                if (error.code === 'INVALID_ID') {
                    searchError = '无效的用户ID格式';
                } else {
                    searchError = '搜索用户时发生错误';
                }
            } else if (user) {
                console.log('Found user:', user._id);
                // 检查用户是否为管理员
                const adminResult = await getAdminByUserId(user._id.toString());
                const isAdmin = adminResult.data !== null;
                const adminPriority = adminResult.data?.priority;
                
                // 将用户数据转换为客户端格式
                searchedUser = {
                    _id: user._id.toString(),
                    name: user.name || '',
                    email: user.email || '',
                    articles: Array.isArray(user.articles) ? user.articles.map((id: any) => id.toString()) : [],
                    likes: Array.isArray(user.likes) ? user.likes.map((id: any) => id.toString()) : [],
                    signature: user.signature || '',
                    createdAt: user.createdAt || new Date(),
                    updatedAt: user.updatedAt || new Date(),
                    isAdmin,
                    adminPriority
                };
            } else {
                searchError = '未找到指定的用户';
            }
        } else {
            // 根据筛选条件获取用户列表
            console.log('Loading users with filter:', filter);
            let userData;
            
            try {
                if (filter === 'recent') {
                    // 获取24小时内更新的用户
                    userData = await getRecentlyUpdatedUsers({
                        limit: 100,
                        hours: 24
                    });
                } else {
                    // 获取所有用户（默认）
                    userData = await getAllUsers({
                        limit: 200, // 增加限制数量
                        page: 1
                    });
                }
                
                if (userData.error || !userData.data) {
                    console.error('Error loading users:', userData.error);
                    users = [];
                } else {
                    // 处理不同的返回格式
                    const userList = Array.isArray(userData.data) ? userData.data : userData.data.users;
                    
                    if (!userList || !Array.isArray(userList)) {
                        console.error('Invalid user list format:', userList);
                        users = [];
                    } else {
                        // 批量检查用户是否为管理员
                        const usersWithAdminStatus = await Promise.all(
                            userList.map(async (user: any) => {
                                try {
                                    if (!user || !user._id) {
                                        console.warn('Invalid user object in list:', user);
                                        return null;
                                    }
                                    
                                    const adminResult = await getAdminByUserId(user._id.toString());
                                    const isAdmin = adminResult.data !== null;
                                    const adminPriority = adminResult.data?.priority;
                                    
                                    return {
                                        _id: user._id.toString(),
                                        name: user.name || '',
                                        email: user.email || '',
                                        articles: Array.isArray(user.articles) ? user.articles.map((id: any) => id.toString()) : [],
                                        likes: Array.isArray(user.likes) ? user.likes.map((id: any) => id.toString()) : [],
                                        signature: user.signature || '',
                                        createdAt: user.createdAt || new Date(),
                                        updatedAt: user.updatedAt || new Date(),
                                        isAdmin,
                                        adminPriority
                                    };
                                } catch (error) {
                                    console.error('Error processing user:', user?._id, error);
                                    return null;
                                }
                            })
                        );
                        
                        // 过滤掉处理失败的用户（null值）
                        const validUsers = usersWithAdminStatus.filter(u => u !== null) as (UserClient & { isAdmin: boolean; adminPriority?: number })[];
                        
                        // 根据筛选条件进一步过滤
                        if (filter === 'admins') {
                            users = validUsers.filter(user => user.isAdmin);
                        } else if (filter === 'users') {
                            users = validUsers.filter(user => !user.isAdmin);
                        } else {
                            users = validUsers;
                        }
                        
                        // 按更新时间排序（最新的在前）
                        users.sort((a, b) => {
                            const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
                            const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
                            return dateB.getTime() - dateA.getTime();
                        });
                    }
                }
            } catch (userLoadError) {
                console.error('Error in user loading process:', userLoadError);
                users = [];
            }
        }
        
        return {
            admin,
            users,
            searchedUser,
            searchError,
            searchId,
            filter
        };
    } catch (error) {
        console.error('Error loading admin users page:', error);
        
        // 尝试至少返回管理员信息，避免完全失败
        try {
            const admin = await requireAdmin(locals.user);
            return {
                admin,
                users: [],
                searchedUser: null,
                searchError: '加载用户列表时发生错误: ' + (error instanceof Error ? error.message : String(error)),
                searchId: url.searchParams.get('id'),
                filter: url.searchParams.get('filter') || 'all'
            };
        } catch (adminError) {
            console.error('Error getting admin info:', adminError);
            throw error; // 如果连管理员信息都获取不到，则抛出错误
        }
    }
};

export const actions: Actions = {
    // 删除用户
    deleteUser: async ({ request, locals }) => {
        const admin = await requireAdmin(locals.user);
        
        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        
        if (!userId) {
            return fail(400, { error: '缺少用户ID' });
        }
        
        try {
            // 检查权限
            const canDelete = await canDeleteUser(admin, userId);
            if (!canDelete) {
                return fail(403, { error: '您没有权限删除此用户' });
            }
            
            // 执行删除
            const { error } = await deleteUser(userId);
            
            if (error) {
                if (error.code === 'INVALID_ID') {
                    return fail(400, { error: '无效的用户ID格式' });
                } else if (error.code === 'NOT_FOUND') {
                    return fail(404, { error: '用户不存在' });
                } else {
                    return fail(500, { error: '删除用户失败: ' + error.message });
                }
            }
            
            return {
                success: true,
                message: '用户删除成功'
            };
        } catch (error: any) {
            console.error('Error deleting user:', error);
            return fail(500, { error: '删除用户时发生错误: ' + error.message });
        }
    }
};
