import { requireAdmin } from '$lib/server/utils/adminAuth';
import { getRecentlyUpdatedArticles, getArticleById, deleteArticleById } from '$lib/server/db/articleCollection';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ArticleClient } from '$lib/types/client';

export const load: PageServerLoad = async ({ locals, url }) => {
    // 只有管理员可以访问此页面
    const admin = await requireAdmin(locals.user);
    
    const searchId = url.searchParams.get('id');
    let articles: ArticleClient[] = [];
    let searchedArticle: ArticleClient | null = null;
    let searchError: string | null = null;
    
    try {
        if (searchId) {
            // 如果有搜索ID，则搜索特定文章
            const { data: article, error } = await getArticleById(searchId);
            if (error) {
                if (error.code === 'INVALID_ID_FORMAT') {
                    searchError = '无效的文章ID格式';
                } else {
                    searchError = '搜索文章时发生错误';
                }
            } else if (article) {
                // 将文章数据转换为客户端格式
                searchedArticle = {
                    _id: article._id.toString(),
                    title: article.title,
                    summary: article.summary,
                    tags: article.tags,
                    authorId: article.authorId.toString(),
                    authorName: article.authorName,
                    body: article.body,
                    createdAt: article.createdAt,
                    status: article.status,
                    likes: article.likes ?? 0
                };
            } else {
                searchError = '未找到指定的文章';
            }
        } else {
            // 获取24小时内更新的已发布文章列表
            const { data: recentArticles, error } = await getRecentlyUpdatedArticles({
                limit: 50,
                status: 'published',  // 只获取已发布的文章
                includeBody: false
            });
            
            if (error) {
                console.error('Error loading recent articles:', error);
                articles = [];
            } else {
                articles = recentArticles || [];
            }
        }
        
        return {
            admin,
            articles,
            searchedArticle,
            searchError,
            searchId
        };
    } catch (error) {
        console.error('Error loading admin articles page:', error);
        return {
            admin,
            articles: [],
            searchedArticle: null,
            searchError: '加载页面时发生错误',
            searchId
        };
    }
};

export const actions: Actions = {
    // 删除文章
    deleteArticle: async ({ request, locals }) => {
        const admin = await requireAdmin(locals.user);
        
        const formData = await request.formData();
        const articleId = formData.get('articleId') as string;
        
        if (!articleId) {
            return fail(400, { error: '缺少文章ID' });
        }
        
        try {
            const { error } = await deleteArticleById(articleId);
            
            if (error) {
                if (error.code === 'INVALID_ID_FORMAT') {
                    return fail(400, { error: '无效的文章ID格式' });
                } else if (error.code === 'NOT_FOUND') {
                    return fail(404, { error: '文章不存在' });
                } else {
                    return fail(500, { error: '删除文章失败: ' + error.message });
                }
            }
            
            return { success: true, message: '文章删除成功' };
        } catch (error: any) {
            return fail(500, { error: '删除文章失败: ' + error.message });
        }
    }
};