// src/lib/server/db/commentCollection.ts

import { getCollection, ObjectId } from './db';
import type { CommentSchema } from '$lib/schema';
import type { CommentCreateShare } from '$lib/types/share';
import type { CommentClient } from '$lib/types/client';
import type { DbResult } from '$lib/schema/db';
import type { InsertOneResult, DeleteResult } from 'mongodb';

const COLLECTION_NAME = 'comments';

/**
 * 为 comments 集合创建必要的索引。
 */
export async function ensureCommentIndexes(): Promise<void> {
    try {
        const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);
        await commentsCollection.createIndex({ articleId: 1 });
        console.log("Index on comments.articleId ensured.");
        await commentsCollection.createIndex({ authorId: 1 });
        console.log("Index on comments.authorId ensured.");
        await commentsCollection.createIndex({ createdAt: -1 });
        console.log("Index on comments.createdAt ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 创建一个新评论并更新相关文章的评论数组
 * @param {CommentCreateShare} commentData - 要创建的评论数据。
 * @returns {Promise<DbResult<InsertOneResult<CommentSchema>>>} 操作结果。
 */
export async function createComment(commentData: CommentCreateShare): Promise<DbResult<InsertOneResult<CommentSchema>>> {
    const { getClient } = await import('./db');
    const client = getClient();
    const session = client.startSession();

    try {
        let creationResult: InsertOneResult<CommentSchema> | null = null;

        await session.withTransaction(async () => {
            const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);
            const articlesCollection = await getCollection<any>('articles');
            const currentTime = new Date();
            const articleObjectId = new ObjectId(commentData.articleId);
            const authorObjectId = new ObjectId(commentData.authorId);

            const newComment: Omit<CommentSchema, '_id'> = {
                articleId: articleObjectId,
                authorId: authorObjectId,
                authorName: commentData.authorName,
                content: commentData.content,
                createdAt: currentTime,
            };

            // 1. 插入评论
            const result = await commentsCollection.insertOne(newComment as CommentSchema, { session });
            if (!result.insertedId) {
                throw new Error('Comment insertion did not return an insertedId.');
            }

            creationResult = result;

            // 2. 更新文章的评论数组
            await articlesCollection.updateOne(
                { _id: articleObjectId },
                { 
                    $push: { comments: result.insertedId } as any,
                    $set: { updatedAt: currentTime }
                },
                { session }
            );
        });

        if (creationResult) {
            return { data: creationResult, error: null };
        } else {
            return { 
                data: null, 
                error: { code: 'TRANSACTION_ERROR', message: 'Transaction completed but result is missing.' } 
            };
        }

    } catch (error: any) {
        console.error('Error creating comment:', error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || 'An unexpected error occurred while creating the comment.'
            }
        };
    } finally {
        await session.endSession();
    }
}

/**
 * 根据文章 ID 获取评论列表
 * @param {string} articleId - 文章的 ID
 * @param {object} options - 查询选项
 * @param {number} [options.limit=50] - 限制返回的评论数量
 * @param {number} [options.skip=0] - 跳过的评论数量
 * @returns {Promise<DbResult<CommentClient[]>>} 评论列表
 */
export async function getCommentsByArticleId(
    articleId: string,
    options: { limit?: number; skip?: number } = {}
): Promise<DbResult<CommentClient[]>> {
    const { limit = 50, skip = 0 } = options;

    try {
        if (!ObjectId.isValid(articleId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided article ID '${articleId}' has an invalid format.`
                }
            };
        }

        const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);
        const articleObjectId = new ObjectId(articleId);

        const commentsFromDb = await commentsCollection
            .find({ articleId: articleObjectId })
            .sort({ createdAt: -1 }) // 最新的评论在前
            .skip(skip)
            .limit(limit)
            .toArray();

        // 将数据库文档映射为客户端安全的对象
        const commentsForClient: CommentClient[] = commentsFromDb.map((comment): CommentClient => ({
            _id: comment._id.toString(),
            articleId: comment.articleId.toString(),
            authorId: comment.authorId.toString(),
            authorName: comment.authorName,
            content: comment.content,
            createdAt: comment.createdAt,
        }));

        return { data: commentsForClient, error: null };

    } catch (error: any) {
        console.error(`Error fetching comments for article ID ${articleId}:`, error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || 'An unexpected error occurred while fetching comments.'
            }
        };
    }
}

/**
 * 获取指定时间后的新评论（管理员专用）
 * @param {Date} since - 获取此时间之后的评论
 * @param {object} options - 查询选项
 * @param {number} [options.limit=50] - 限制返回的评论数量
 * @returns {Promise<DbResult<CommentClient[]>>} 新评论列表
 */
export async function getCommentsAfter(
    since: Date,
    options: { limit?: number } = {}
): Promise<DbResult<CommentClient[]>> {
    const { limit = 50 } = options;

    try {
        const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);

        const commentsFromDb = await commentsCollection
            .find({ createdAt: { $gt: since } })
            .sort({ createdAt: -1 }) // 最新的评论在前
            .limit(limit)
            .toArray();

        // 将数据库文档映射为客户端安全的对象
        const commentsForClient: CommentClient[] = commentsFromDb.map((comment): CommentClient => ({
            _id: comment._id.toString(),
            articleId: comment.articleId.toString(),
            authorId: comment.authorId.toString(),
            authorName: comment.authorName,
            content: comment.content,
            createdAt: comment.createdAt,
        }));

        return { data: commentsForClient, error: null };

    } catch (error: any) {
        console.error('Error fetching new comments:', error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || 'An unexpected error occurred while fetching new comments.'
            }
        };
    }
}

/**
 * 根据评论 ID 删除评论，并从相关文章的评论数组中移除
 * @param {string} commentId - 要删除的评论的 _id (字符串形式)
 * @returns {Promise<DbResult<null>>} 删除结果
 */
export async function deleteCommentById(commentId: string): Promise<DbResult<null>> {
    const { getClient } = await import('./db');
    const client = getClient();
    const session = client.startSession();

    try {
        if (!ObjectId.isValid(commentId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided comment ID '${commentId}' has an invalid format.`,
                },
            };
        }

        let result: any = null;

        await session.withTransaction(async () => {
            const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);
            const articlesCollection = await getCollection<any>('articles');
            const objectId = new ObjectId(commentId);

            // 1. 获取评论信息（用于获取文章ID）
            const comment = await commentsCollection.findOne({ _id: objectId }, { session });
            if (!comment) {
                throw new Error(`Comment with ID '${commentId}' not found.`);
            }

            // 2. 删除评论
            const deleteResult = await commentsCollection.deleteOne({ _id: objectId }, { session });
            
            if (deleteResult.deletedCount === 0) {
                throw new Error(`Comment with ID '${commentId}' not found.`);
            }

            // 3. 从文章的评论数组中移除该评论ID
            await articlesCollection.updateOne(
                { _id: comment.articleId },
                { 
                    $pull: { comments: objectId } as any,
                    $set: { updatedAt: new Date() }
                },
                { session }
            );

            result = { success: true };
        });

        return { data: null, error: null };
    } catch (error: any) {
        console.error(`Error deleting comment with ID ${commentId}:`, error);
        
        if (error.message.includes('not found')) {
            return {
                data: null,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message,
                },
            };
        }

        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || `An unexpected error occurred while deleting comment ${commentId}.`,
            },
        };
    } finally {
        await session.endSession();
    }
}

/**
 * 根据关键词搜索评论（管理员专用）
 * @param {string} searchTerm - 搜索关键词
 * @param {object} options - 查询选项
 * @param {number} [options.limit=50] - 限制返回的评论数量
 * @param {number} [options.skip=0] - 跳过的评论数量
 * @returns {Promise<DbResult<CommentClient[]>>} 搜索结果
 */
export async function searchComments(
    searchTerm: string,
    options: { limit?: number; skip?: number } = {}
): Promise<DbResult<CommentClient[]>> {
    const { limit = 50, skip = 0 } = options;

    try {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return {
                data: [],
                error: null
            };
        }

        const commentsCollection = await getCollection<CommentSchema>(COLLECTION_NAME);
        const trimmedSearchTerm = searchTerm.trim();

        // 构建搜索条件，支持评论内容、作者名搜索
        const searchQuery = {
            $or: [
                { content: { $regex: trimmedSearchTerm, $options: 'i' } },
                { authorName: { $regex: trimmedSearchTerm, $options: 'i' } }
            ]
        };

        const commentsFromDb = await commentsCollection
            .find(searchQuery)
            .sort({ createdAt: -1 }) // 最新的评论在前
            .skip(skip)
            .limit(limit)
            .toArray();

        // 将数据库文档映射为客户端安全的对象
        const commentsForClient: CommentClient[] = commentsFromDb.map((comment): CommentClient => ({
            _id: comment._id.toString(),
            articleId: comment.articleId.toString(),
            authorId: comment.authorId.toString(),
            authorName: comment.authorName,
            content: comment.content,
            createdAt: comment.createdAt,
        }));

        return { data: commentsForClient, error: null };

    } catch (error: any) {
        console.error('Error searching comments:', error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || 'An unexpected error occurred while searching comments.'
            }
        };
    }
}