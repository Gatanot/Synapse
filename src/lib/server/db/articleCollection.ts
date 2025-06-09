// src/lib/server/db/articleCollection.ts

import { getCollection, getClient, ObjectId } from './db';
import { addArticleToUser } from './userCollection'; // 假设它在同一目录
import type { ArticleSchema, ArticleStatus } from '$lib/schema';
import type { ArticleCreateShare } from '$lib/types/share';
import type { ArticleClient, } from '$lib/types/client';
import type { GetArticlesOptions } from '$lib/types/server';
import type { DbResult } from '$lib/schema/db';
import type { InsertOneResult } from 'mongodb';

const COLLECTION_NAME = 'articles';

/**
 * 为 articles 集合创建必要的索引。
 */
export async function ensureArticleIndexes(): Promise<void> {
    try {
        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
        await articlesCollection.createIndex({ authorId: 1 });
        console.log("Index on articles.authorId ensured.");
        await articlesCollection.createIndex({ tags: 1 });
        console.log("Index on articles.tags ensured.");
        await articlesCollection.createIndex({ status: 1 });
        console.log("Index on articles.status ensured.");
    } catch (error) {
        throw error;
    }
}

/**
 * 创建一篇新文章，并以事务方式将其 ID 添加到对应用户的 `articles` 数组中。
 * @param {ArticleCreateShare} articleData - 要创建的文章数据。
 * @returns {Promise<DbResult<InsertOneResult<ArticleSchema>>>} 操作结果。
 */
export async function createArticle(articleData: ArticleCreateShare): Promise<DbResult<InsertOneResult<ArticleSchema>>> {
    const client = getClient();
    const session = client.startSession();

    try {
        let creationResult: InsertOneResult<ArticleSchema> | null = null;

        await session.withTransaction(async () => {
            const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
            const currentTime = new Date();
            const authorObjectId = new ObjectId(articleData.authorId);

            const newArticle: Omit<ArticleSchema, '_id'> = {
                title: articleData.title,
                summary: articleData.summary,
                tags: articleData.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean),
                authorId: authorObjectId,
                authorName: articleData.authorName,
                body: articleData.body,
                createdAt: currentTime,
                updatedAt: currentTime,
                comments: [],
                status: articleData.status || 'draft',
                likes: []
            };

            const result = await articlesCollection.insertOne(newArticle as ArticleSchema, { session });
            if (!result.insertedId) {
                throw new Error('Article insertion did not return an insertedId.');
            }

            creationResult = result;
            const newArticleId = result.insertedId;

            // 调用已经类型化的 userCollection 函数
            await addArticleToUser(authorObjectId, newArticleId, { session });

            console.log(`Transaction successful: Article ${newArticleId} created and linked to user ${authorObjectId}.`);
        });

        if (creationResult) {
            return { data: creationResult, error: null };
        } else {
            return { data: null, error: { code: 'UNKNOWN_TRANSACTION_ERROR', message: 'Transaction completed, but result is missing.' } };
        }

    } catch (error: any) {
        console.error('Error during article creation transaction:', error);
        return {
            data: null,
            error: {
                code: 'TRANSACTION_ERROR',
                message: error.message || 'An unexpected error occurred during the article creation process.'
            }
        };
    } finally {
        await session.endSession();
    }
}

/**
 * 获取最新创建的指定数量的文章。
 * @param {GetArticlesOptions} [options={}] - 查询选项
 * @returns {Promise<DbResult<ArticleClient[]>>} 包含客户端文章对象的数组。
 */
export async function getLatestArticles(options: GetArticlesOptions = {}): Promise<DbResult<ArticleClient[]>> {
    const {
        limit = 10,
        skip = 0,
        status = 'published',
        includeBody = false
    } = options;

    try {
        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);

        const query: { status?: ArticleStatus } = {};
        if (status !== 'all') {
            query.status = status;
        }

        const projection: Record<string, 1> = {
            title: 1,
            summary: 1,
            tags: 1,
            authorId: 1,
            authorName: 1,
            createdAt: 1,
            status: 1,
        };
        if (includeBody) {
            projection.body = 1;
        }

        const articlesFromDb = await articlesCollection
            .find(query)
            .project(projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // 将数据库文档映射为客户端安全的对象
        const articlesForClient: ArticleClient[] = articlesFromDb.map((article): ArticleClient => ({
            _id: article._id.toString(),
            title: article.title,
            summary: article.summary,
            tags: article.tags,
            authorId: article.authorId.toString(),
            authorName: article.authorName,
            createdAt: article.createdAt,
            status: article.status,
            ...(includeBody && { body: article.body }), // 条件性地包含 body
        }));

        return { data: articlesForClient, error: null };

    } catch (error: any) {
        console.error('Error fetching latest articles:', error);
        return { data: null, error: { code: 'DB_ERROR', message: error.message || 'An unexpected error occurred while fetching articles.' } };
    }
}