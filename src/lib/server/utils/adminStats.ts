/**
 * @fileoverview 管理员统计数据模块
 * @description 提供管理后台的数据统计功能，包括用户、文章、评论的统计信息
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection } from '../db/db';
import type { UserSchema, ArticleSchema, CommentSchema } from '$lib/schema';

/**
 * 管理员统计数据接口
 * @interface AdminStats
 * @property {number} totalUsers - 总用户数
 * @property {number} totalArticles - 总文章数（已发布）
 * @property {number} totalComments - 总评论数
 * @property {number} todayNew - 今日新增内容总数
 */
export interface AdminStats {
    totalUsers: number;
    totalArticles: number;
    totalComments: number;
    todayNew: number;
}

/**
 * 获取管理后台统计数据
 * @description 使用聚合查询获取平台各项数据统计，包括总量和今日新增
 * @returns {Promise<AdminStats>} 统计数据对象
 * @throws {Error} 当数据库查询失败时抛出错误
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
            // 总文章数（只统计已发布的文章）
            getCollection<ArticleSchema>('articles').then(collection => 
                collection.countDocuments({ status: 'published' })
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
                    collection.countDocuments({ createdAt: { $gte: today }, status: 'published' })
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
                collection.countDocuments({ createdAt: { $gte: today }, status: 'published' })
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
