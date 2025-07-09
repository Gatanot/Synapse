// src/lib/server/db/commentCollection.ts

import { getCollection, ObjectId } from './db';
import type { CommentSchema } from '$lib/schema';
import type { CommentCreateShare } from '$lib/types/share';
import type { CommentClient } from '$lib/types/client';
import type { DbResult } from '$lib/schema/db';
import type { InsertOneResult } from 'mongodb';

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

            console.log(`Comment ${result.insertedId} created and linked to article ${articleObjectId}.`);
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