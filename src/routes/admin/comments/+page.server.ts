import { requireAdmin } from '$lib/server/utils/adminAuth';
import { getCommentsAfter, deleteCommentById, searchComments } from '$lib/server/db/commentCollection';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { CommentClient } from '$lib/types/client';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
    // 只有管理员可以访问此页面
    const admin = await requireAdmin(locals.user);
    
    // 检查是否有搜索关键词
    const searchTerm = url.searchParams.get('search');
    
    let newComments: CommentClient[] = [];
    let searchResults: CommentClient[] = [];
    let commentsError: string | null = null;
    let searchError: string | null = null;
    let lastVisit: string;
    
    if (searchTerm && searchTerm.trim()) {
        // 搜索模式
        try {
            const { data: comments, error } = await searchComments(searchTerm.trim(), { limit: 100 });
            
            if (error) {
                console.error('Error searching comments:', error);
                searchError = '搜索评论时发生错误';
            } else {
                searchResults = comments || [];
            }
        } catch (error) {
            console.error('Error searching comments:', error);
            searchError = '搜索评论时发生错误';
        }
        
        // 设置一个默认的lastVisit，即使在搜索模式下也要返回
        lastVisit = new Date().toISOString();
    } else {
        // 正常模式：显示新评论
        // 获取上次访问该页面的时间
        const lastVisitKey = 'admin_comments_last_visit';
        const lastVisitCookie = cookies.get(lastVisitKey);
        let lastVisitDate: Date;
        
        if (lastVisitCookie) {
            lastVisitDate = new Date(lastVisitCookie);
        } else {
            // 如果是第一次访问，设置为24小时前
            lastVisitDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }
        
        try {
            // 获取自上次访问以来的新评论
            const { data: comments, error } = await getCommentsAfter(lastVisitDate, { limit: 100 });
            
            if (error) {
                console.error('Error loading new comments:', error);
                commentsError = '加载新评论时发生错误';
            } else {
                newComments = comments || [];
            }
            
            // 更新访问时间cookie（设置为当前时间）
            const now = new Date();
            cookies.set(lastVisitKey, now.toISOString(), {
                path: '/admin/comments',
                maxAge: 365 * 24 * 60 * 60, // 1年
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });
            
            lastVisit = lastVisitDate.toISOString();
        } catch (error) {
            console.error('Error loading admin comments page:', error);
            commentsError = '加载页面时发生错误';
            lastVisit = new Date().toISOString();
        }
    }
    
    return {
        admin,
        newComments,
        searchResults,
        commentsError,
        searchError,
        searchTerm: searchTerm || '',
        lastVisit
    };
};

export const actions: Actions = {
    // 删除评论
    deleteComment: async ({ request, locals }) => {
        const admin = await requireAdmin(locals.user);
        
        const formData = await request.formData();
        const commentId = formData.get('commentId') as string;
        
        if (!commentId) {
            return fail(400, { error: '缺少评论ID' });
        }
        
        try {
            const { error } = await deleteCommentById(commentId);
            
            if (error) {
                if (error.code === 'INVALID_ID_FORMAT') {
                    return fail(400, { error: '无效的评论ID格式' });
                } else if (error.code === 'NOT_FOUND') {
                    return fail(404, { error: '评论不存在' });
                } else {
                    return fail(500, { error: '删除评论失败: ' + error.message });
                }
            }
            
            return { success: true, message: '评论删除成功' };
        } catch (error: any) {
            return fail(500, { error: '删除评论失败: ' + error.message });
        }
    }
};