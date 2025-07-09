import { getAdminStats } from '$lib/server/utils/adminStats';
import { requireAdmin } from '$lib/server/utils/adminAuth';
import type { AdminStats } from '$lib/server/utils/adminStats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // 使用权限检查中间件
    const admin = await requireAdmin(locals.user);
    
    try {
        const stats: AdminStats = await getAdminStats();
        
        return {
            stats,
            admin
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
            },
            admin
        };
    }
};
