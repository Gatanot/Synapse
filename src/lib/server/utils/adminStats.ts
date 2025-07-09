// src/lib/server/utils/adminStats.ts

import { getCollection } from '../db/db';
import type { UserSchema, ArticleSchema, CommentSchema } from '$lib/schema';

export interface AdminStats {
    totalUsers: number;
    totalArticles: number;
    totalComments: number;
    todayNew: number;
}

/**
 * 获取后台管理统计数据
 * 使用聚合查询优化性能
 */
export async function getAdminStats(): Promise<AdminStats> {
    try {
        // 获取今天的开始时间（00:00:00）
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 使用Promise.allSettled来确保即使部分查询失败也能返回结果
        const results = await Promise.allSettled([
            // 总用户数
            getCollection<UserSchema>('users').then(collection => 
                collection.estimatedDocumentCount()
            ),
            // 总文章数
            getCollection<ArticleSchema>('articles').then(collection => 
                collection.estimatedDocumentCount()
            ),
            // 总评论数
            getCollection<CommentSchema>('comments').then(collection => 
                collection.estimatedDocumentCount()
            ),
            // 今日新增统计（一次聚合查询获取所有今日数据）
            Promise.all([
                getCollection<UserSchema>('users').then(collection => 
                    collection.countDocuments({ createdAt: { $gte: today } })
                ),
                getCollection<ArticleSchema>('articles').then(collection => 
                    collection.countDocuments({ createdAt: { $gte: today } })
                ),
                getCollection<CommentSchema>('comments').then(collection => 
                    collection.countDocuments({ createdAt: { $gte: today } })
                )
            ])
        ]);

        // 处理结果，即使某些查询失败也能返回可用数据
        const totalUsers = results[0].status === 'fulfilled' ? results[0].value : 0;
        const totalArticles = results[1].status === 'fulfilled' ? results[1].value : 0;
        const totalComments = results[2].status === 'fulfilled' ? results[2].value : 0;
        
        let todayNew = 0;
        if (results[3].status === 'fulfilled') {
            const [todayUsers, todayArticles, todayComments] = results[3].value;
            todayNew = todayUsers + todayArticles + todayComments;
        }

        return {
            totalUsers,
            totalArticles,
            totalComments,
            todayNew
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        // 返回默认值，确保页面不会崩溃
        return {
            totalUsers: 0,
            totalArticles: 0,
            totalComments: 0,
            todayNew: 0
        };
    }
}

/**
 * 获取详细的今日统计信息
 */
export async function getTodayStats(): Promise<{
    todayUsers: number;
    todayArticles: number;
    todayComments: number;
}> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayUsers, todayArticles, todayComments] = await Promise.all([
            getCollection<UserSchema>('users').then(collection => 
                collection.countDocuments({ createdAt: { $gte: today } })
            ),
            getCollection<ArticleSchema>('articles').then(collection => 
                collection.countDocuments({ createdAt: { $gte: today } })
            ),
            getCollection<CommentSchema>('comments').then(collection => 
                collection.countDocuments({ createdAt: { $gte: today } })
            )
        ]);

        return {
            todayUsers,
            todayArticles,
            todayComments
        };
    } catch (error) {
        console.error('Error fetching today stats:', error);
        return {
            todayUsers: 0,
            todayArticles: 0,
            todayComments: 0
        };
    }
}
