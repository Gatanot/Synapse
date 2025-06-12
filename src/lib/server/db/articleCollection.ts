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

/**
 * 根据文章 ID 获取完整的文章文档。
 * @param {string} articleId - 要查询的文章的 _id (字符串形式)。
 * @returns {Promise<DbResult<ArticleSchema | null>>} 包含完整文章文档或 null 的结果对象。
 */
export async function getArticleById(articleId: string): Promise<DbResult<ArticleSchema | null>> {
    try {
        // 1. 提前验证 ID 格式，提供更清晰的错误
        if (!ObjectId.isValid(articleId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided article ID '${articleId}' has an invalid format.`
                }
            };
        }

        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);

        // 将字符串 ID 转换为 MongoDB 的 ObjectId
        const objectId = new ObjectId(articleId);

        // 定义查询条件
        const query = { _id: objectId };

        // 使用 findOne 查找单个文档，不使用投影以获取所有字段
        const article = await articlesCollection.findOne(query);

        // 2. 如果没有找到文章
        if (!article) {
            return {
                data: null,
                error: null
            };
        }

        // 3. 成功，返回完整的文章文档
        return { data: article, error: null };

    } catch (error: any) {
        console.error(`Error fetching article for ID ${articleId}:`, error);

        // 4. 捕获其他数据库层面的错误
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || `An unexpected error occurred while fetching article ${articleId}.`
            }
        };
    }
}

/**
 * 根据文章 ID 获取对应的作者 ID。
 * @param {string} articleId - 要查询的文章的 _id (字符串形式)。
 * @returns {Promise<DbResult<string | null>>} 包含作者 ID 或 null 的结果对象。
 */
export async function getAuthorIdById(articleId: string): Promise<DbResult<string | null>> {
    try {
        if (!ObjectId.isValid(articleId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided article ID '${articleId}' has an invalid format.`,
                },
            };
        }

        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
        const objectId = new ObjectId(articleId);

        // 查询仅返回 authorId 字段
        const article = await articlesCollection.findOne(
            { _id: objectId },
            { projection: { authorId: 1 } }
        );

        if (!article) {
            return { data: null, error: null };
        }

        return { data: article.authorId.toString(), error: null };
    } catch (error: any) {
        console.error(`Error fetching authorId for article ID ${articleId}:`, error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || `An unexpected error occurred while fetching authorId for article ${articleId}.`,
            },
        };
    }
}

/**
 * 根据文章 ID 更新文章内容。
 * @param {string} articleId - 要更新的文章的 _id (字符串形式)。
 * @param {Partial<ArticleSchema>} updateData - 要更新的字段及其值。
 * @returns {Promise<DbResult<null>>} 包含操作结果的对象。
 */
export async function updateArticleById(
    articleId: string,
    updateData: Partial<ArticleSchema>
): Promise<DbResult<null>> {
    try {
        // 验证 ID 格式
        if (!ObjectId.isValid(articleId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided article ID '${articleId}' has an invalid format.`,
                },
            };
        }

        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
        const objectId = new ObjectId(articleId);

        // 执行更新操作，将传入数据的字段更新到数据库中对应字段
        const result = await articlesCollection.updateOne(
            { _id: objectId },
            { $set: { ...updateData } }
        );

        if (result.matchedCount === 0) {
            return {
                data: null,
                error: {
                    code: 'UPDATE_FAILED',
                    message: `Article with ID '${articleId} not found'.`,
                },
            };
        }

        return { data: null, error: null };
    } catch (error: any) {
        console.error(`Error updating article with ID ${articleId}:`, error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || `An unexpected error occurred while updating article ${articleId}.`,
            },
        };
    }
}

/**
 * 根据用户 ID 获取文章列表。
 * @param {string} userId - 用户的 ID。
 * @param {object} options - 查询选项。
 * @param {boolean} [options.includeBody=false] - 是否包含文章正文。
 * @returns {Promise<DbResult<ArticleClient[]>>}
 */
export async function getArticlesByUserId(
    userId: string,
    options: { includeBody?: boolean } = {}
): Promise<DbResult<ArticleClient[]>> {
    const { includeBody = false } = options;

    try {
        if (!ObjectId.isValid(userId)) {
            return {
                data: null,
                error: {
                    code: 'INVALID_ID_FORMAT',
                    message: `The provided user ID '${userId}' has an invalid format.`,
                },
            };
        }

        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
        const userObjectId = new ObjectId(userId);

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
            .find({ authorId: userObjectId })
            .project(projection)
            .sort({ createdAt: -1 })
            .toArray();

        const articlesForClient: ArticleClient[] = articlesFromDb.map((article) => ({
            _id: article._id.toString(),
            title: article.title,
            summary: article.summary,
            tags: article.tags,
            authorId: article.authorId.toString(),
            authorName: article.authorName,
            createdAt: article.createdAt,
            status: article.status,
            ...(includeBody && { body: article.body }),
        }));
        return { data: articlesForClient, error: null };
    } catch (error: any) {
        console.error(`Error fetching articles for user ID ${userId}:`, error);
        return {
            data: null,
            error: {
                code: 'DB_ERROR',
                message: error.message || 'An unexpected error occurred while fetching articles.',
            },
        };
    }
}