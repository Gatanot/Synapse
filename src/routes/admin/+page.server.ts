import { getAdminStats } from '$lib/server/utils/adminStats';
import type { AdminStats } from '$lib/server/utils/adminStats';

export const load = async ({ locals }: { locals: any }) => {
    // 这里可以添加权限检查逻辑
    // 例如：检查用户是否为管理员
    // if (!locals.user || !locals.user.isAdmin) {
    //     throw redirect(302, '/login');
    // }
    
    try {
        const stats: AdminStats = await getAdminStats();
        
        return {
            stats
        };
    } catch (error) {
        console.error('Error loading admin stats:', error);
        // 返回默认统计数据
        return {
            stats: {
                totalUsers: 0,
                totalArticles: 0,
                totalComments: 0,
                todayNew: 0
            }
        };
    }
};
