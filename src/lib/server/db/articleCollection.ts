// src/lib/server/db/articleCollection.ts

import { getCollection, getClient, ObjectId } from './db';
import { addArticleToUser } from './userCollection'; // 假设它在同一目录
import type { ArticleSchema, ArticleStatus, UserSchema } from '$lib/schema';
import type { ArticleCreateShare } from '$lib/types/share';
import type { ArticleClient, } from '$lib/types/client';
import type { GetArticlesOptions, SearchOptions } from '$lib/types/server';
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
                likes:0
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
        limit,
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
            likes: 1, // 添加 likes 字段到投影
        };
        if (includeBody) {
            projection.body = 1;
        }

        let query_builder = articlesCollection
            .find(query)
            .project(projection)
            .sort({ createdAt: -1 })
            .skip(skip);

        // 只有在提供 limit 时才应用限制
        if (limit !== undefined) {
            query_builder = query_builder.limit(limit);
        }

        const articlesFromDb = await query_builder.toArray();

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
            likes: article.likes ?? 0,
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
                    code: 'NOT_FOUND',
                    message: `Article with ID ${articleId} not found.`,
                },
            };
        }
        return { data: null, error: null };
    } catch (error: any) {
        console.error(`Error updating article ${articleId}:`, error);
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
 * @param {GetArticlesOptions} options - 查询选项。
 * @returns {Promise<DbResult<ArticleClient[]>>}
 */
export async function getArticlesByUserId(
    userId: string,
    options: GetArticlesOptions = {}
): Promise<DbResult<ArticleClient[]>> {
    const { includeBody = false, status = 'all', limit, skip } = options;

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

        // 构建查询条件
        const filter: any = { authorId: userObjectId };
        if (status !== 'all') {
            filter.status = status;
        }

        const projection: Record<string, 1> = {
            title: 1,
            summary: 1,
            tags: 1,
            authorId: 1,
            authorName: 1,
            createdAt: 1,
            status: 1,
            likes: 1, // 添加 likes 字段到投影
        };
        if (includeBody) {
            projection.body = 1;
        }

        let query = articlesCollection
            .find(filter)
            .project(projection)
            .sort({ createdAt: -1 });
        
        if (skip) {
            query = query.skip(skip);
        }
        if (limit) {
            query = query.limit(limit);
        }

        const articlesFromDb = await query.toArray();

        const articlesForClient: ArticleClient[] = articlesFromDb.map((article) => ({
            _id: article._id.toString(),
            title: article.title,
            summary: article.summary,
            tags: article.tags,
            authorId: article.authorId.toString(),
            authorName: article.authorName,
            createdAt: article.createdAt,
            status: article.status,
            likes: article.likes ?? 0, // 添加 likes 字段映射
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

/**
 * 根据搜索关键词搜索文章，支持按标题、标签、作者名、内容搜索
 * 如果精确匹配结果少于3个，会自动进行模糊搜索
 * @param {string} searchTerm - 搜索关键词
 * @param {SearchOptions} options - 查询选项
 * @returns {Promise<DbResult<ArticleClient[]>>} 搜索结果
 */
export async function searchArticles(
    searchTerm: string, 
    options: SearchOptions = {}
): Promise<DbResult<ArticleClient[]>> {
    const {
        limit = 20,
        skip = 0,
        status = 'published',
        includeBody = false,
        searchType = 'all'
    } = options;

    try {
        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);

        // 构建基础查询
        const baseQuery: any = status !== 'all' ? { status } : {};
        
        // 第一步：精确搜索
        let searchConditions: any[] = [];
        
        // 根据搜索类型构建不同的搜索条件
        switch (searchType) {
            case 'title':
                searchConditions = [
                    { title: { $regex: searchTerm, $options: 'i' } }
                ];
                break;
            case 'tags':
                searchConditions = [
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                ];
                break;
            case 'author':
                searchConditions = [
                    { authorName: { $regex: searchTerm, $options: 'i' } }
                ];
                break;
            case 'content':
                searchConditions = [
                    { body: { $regex: searchTerm, $options: 'i' } }
                ];
                break;
            case 'all':
            default:
                searchConditions = [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } },
                    { authorName: { $regex: searchTerm, $options: 'i' } },
                    { body: { $regex: searchTerm, $options: 'i' } }
                ];
                break;
        }

        const exactSearchQuery: any = {
            ...baseQuery,
            $or: searchConditions
        };

        const projection: Record<string, 1> = {
            title: 1,
            summary: 1,
            tags: 1,
            authorId: 1,
            authorName: 1,
            createdAt: 1,
            status: 1,
            likes: 1,
        };
        if (includeBody) {
            projection.body = 1;
        }

        // 执行精确搜索
        let articlesFromDb = await articlesCollection
            .find(exactSearchQuery)
            .project(projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        let isFuzzySearch = false;
        let fuzzySearchTermsUsed: string[] = [];

        // 如果精确搜索结果少于3个且搜索词长度大于1，进行模糊搜索
        if (articlesFromDb.length < 3 && searchTerm.length > 1) {
            console.log(`精确搜索只找到 ${articlesFromDb.length} 个结果，开始模糊搜索...`);
            
            // 模糊搜索：分词搜索 + 部分匹配
            const fuzzySearchConditions: any[] = [];
            
            // 1. 分词搜索（按空格、标点符号分割）
            const words = searchTerm.split(/[\s\-_,，。！？；：、]/g)
                .filter(word => word.trim().length > 0);
            
            // 2. 部分匹配（如果搜索词长度大于2，尝试每个字符的部分匹配）
            const partialTerms: string[] = [];
            if (searchTerm.length > 2) {
                // 生成2-字符和3-字符的子串
                for (let i = 0; i <= searchTerm.length - 2; i++) {
                    partialTerms.push(searchTerm.substring(i, i + 2));
                    if (i <= searchTerm.length - 3) {
                        partialTerms.push(searchTerm.substring(i, i + 3));
                    }
                }
            }
            
            const allSearchTerms = [...words, ...partialTerms].filter(term => term.length > 1);
            fuzzySearchTermsUsed = [...words]; // 记录用于提示的主要分词
            
            // 构建模糊搜索条件
            for (const term of allSearchTerms) {
                switch (searchType) {
                    case 'title':
                        fuzzySearchConditions.push(
                            { title: { $regex: term, $options: 'i' } }
                        );
                        break;
                    case 'tags':
                        fuzzySearchConditions.push(
                            { tags: { $in: [new RegExp(term, 'i')] } }
                        );
                        break;
                    case 'author':
                        fuzzySearchConditions.push(
                            { authorName: { $regex: term, $options: 'i' } }
                        );
                        break;
                    case 'content':
                        fuzzySearchConditions.push(
                            { body: { $regex: term, $options: 'i' } }
                        );
                        break;
                    case 'all':
                    default:
                        fuzzySearchConditions.push(
                            { title: { $regex: term, $options: 'i' } },
                            { tags: { $in: [new RegExp(term, 'i')] } },
                            { authorName: { $regex: term, $options: 'i' } },
                            { body: { $regex: term, $options: 'i' } }
                        );
                        break;
                }
            }

            if (fuzzySearchConditions.length > 0) {
                const fuzzySearchQuery: any = {
                    ...baseQuery,
                    $or: fuzzySearchConditions
                };

                // 执行模糊搜索，但排除已经找到的文章
                const exactIds = articlesFromDb.map(article => article._id);
                if (exactIds.length > 0) {
                    fuzzySearchQuery._id = { $nin: exactIds };
                }

                const fuzzyArticles = await articlesCollection
                    .find(fuzzySearchQuery)
                    .project(projection)
                    .sort({ createdAt: -1 })
                    .limit(limit - articlesFromDb.length) // 剩余数量
                    .toArray();

                // 合并精确搜索和模糊搜索的结果
                articlesFromDb = [...articlesFromDb, ...fuzzyArticles];
                
                if (fuzzyArticles.length > 0) {
                    isFuzzySearch = true;
                    console.log(`模糊搜索额外找到 ${fuzzyArticles.length} 个结果`);
                }
            }
        }

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
            likes: article.likes ?? 0,
            ...(includeBody && { body: article.body }),
        }));

        // 在返回的数据中添加模糊搜索信息
        const result: any = {
            data: articlesForClient,
            error: null
        };

        // 如果使用了模糊搜索，添加相关信息
        if (isFuzzySearch && articlesForClient.length > 0) {
            result.fuzzySearchInfo = {
                originalTerm: searchTerm,
                fuzzyTerms: fuzzySearchTermsUsed,
                isFuzzySearch: true
            };
        }

        return result;
    } catch (error: any) {
        console.error(`Error searching articles with term "${searchTerm}":`, error);
        return {
            data: null,
            error: { code: 'SEARCH_ERROR', message: error.message }
        };
    }
}

/**
 * 获取24小时内更新的文章列表（管理员专用）
 * @param {GetArticlesOptions} [options={}] - 查询选项
 * @returns {Promise<DbResult<ArticleClient[]>>} 包含24小时内更新文章的数组
 */
export async function getRecentlyUpdatedArticles(options: GetArticlesOptions = {}): Promise<DbResult<ArticleClient[]>> {
    const {
        limit = 50,
        skip = 0,
        status = 'all',
        includeBody = false
    } = options;

    try {
        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);

        // 计算24小时前的时间
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 构建查询条件
        const query: any = {
            updatedAt: { $gte: twentyFourHoursAgo }
        };
        
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
            updatedAt: 1,
            status: 1,
            likes: 1,
        };
        if (includeBody) {
            projection.body = 1;
        }

        const articlesFromDb = await articlesCollection
            .find(query)
            .project(projection)
            .sort({ updatedAt: -1 }) // 按更新时间倒序
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
            likes: article.likes ?? 0,
            ...(includeBody && { body: article.body }), // 条件性地包含 body
        }));

        return { data: articlesForClient, error: null };

    } catch (error: any) {
        console.error('Error fetching recently updated articles:', error);
        return { data: null, error: { code: 'DB_ERROR', message: error.message || 'An unexpected error occurred while fetching recently updated articles.' } };
    }
}

/**
 * 根据文章 ID 删除文章，并从所有用户的点赞列表中移除该文章
 * @param {string} articleId - 要删除的文章的 _id (字符串形式)
 * @returns {Promise<DbResult<null>>} 删除结果
 */
export async function deleteArticleById(articleId: string): Promise<DbResult<null>> {
    const client = getClient();
    const session = client.startSession();

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

        let result: any = null;

        await session.withTransaction(async () => {
            const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
            const usersCollection = await getCollection<UserSchema>('users');
            const objectId = new ObjectId(articleId);

            // 1. 删除文章
            const deleteResult = await articlesCollection.deleteOne({ _id: objectId }, { session });
            
            if (deleteResult.deletedCount === 0) {
                throw new Error(`Article with ID '${articleId}' not found.`);
            }

            // 2. 从所有用户的点赞列表中移除该文章ID
            await usersCollection.updateMany(
                { likes: objectId },
                { 
                    $pull: { likes: objectId },
                    $set: { updatedAt: new Date() }
                },
                { session }
            );

            result = { success: true };
        });

        return { data: null, error: null };
    } catch (error: any) {
        console.error(`Error deleting article with ID ${articleId}:`, error);
        
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
                message: error.message || `An unexpected error occurred while deleting article ${articleId}.`,
            },
        };
    } finally {
        await session.endSession();
    }
}