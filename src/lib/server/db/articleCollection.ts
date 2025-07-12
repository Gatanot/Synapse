/**
 * @fileoverview 文章集合数据库操作模块
 * @description 提供文章相关的数据库CRUD操作，包括文章创建、查询、更新、删除和搜索功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection, getClient, ObjectId } from './db';
import { addArticleToUser } from './userCollection';
import type { ArticleSchema, ArticleStatus, UserSchema } from '$lib/schema';
import type { ArticleCreateShare } from '$lib/types/share';
import type { ArticleClient, } from '$lib/types/client';
import type { GetArticlesOptions, SearchOptions } from '$lib/types/server';
import type { DbResult } from '$lib/schema/db';
import type { InsertOneResult } from 'mongodb';

const COLLECTION_NAME = 'articles';

/**
 * 为文章集合创建必要的索引
 * @description 创建文章查询性能优化所需的索引，包括作者ID、标签和状态索引
 * @throws {Error} 当索引创建失败时抛出错误
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
 * 创建新文章
 * @description 以事务方式创建文章并将文章ID添加到用户的文章列表中
 * @param {ArticleCreateShare} articleData - 文章创建数据
 * @returns {Promise<DbResult<InsertOneResult<ArticleSchema>>>} 创建操作结果
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
 * 字符级分词函数：将词拆分为字符和子串
 */
function characterTokenize(text: string): string[] {
    if (!text) return [];
    
    const cleanText = text.toLowerCase().trim();
    const tokens: string[] = [];
    
    // 添加完整词
    tokens.push(cleanText);
    
    // 添加单个字符
    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (char.match(/[a-z\u4e00-\u9fa5]/)) { // 只保留字母和中文
            tokens.push(char);
        }
    }
    
    // 添加2-3字符的子串
    for (let i = 0; i < cleanText.length - 1; i++) {
        if (i + 2 <= cleanText.length) {
            const substr = cleanText.substring(i, i + 2);
            if (substr.match(/^[a-z\u4e00-\u9fa5]+$/)) {
                tokens.push(substr);
            }
        }
        if (i + 3 <= cleanText.length) {
            const substr = cleanText.substring(i, i + 3);
            if (substr.match(/^[a-z\u4e00-\u9fa5]+$/)) {
                tokens.push(substr);
            }
        }
    }
    
    return [...new Set(tokens)]; // 去重
}

/**
 * 计算文本匹配分数
 */
function calculateMatchScore(searchTokens: string[], targetText: string, weight: number = 1): number {
    if (!targetText || searchTokens.length === 0) return 0;
    
    const targetLower = targetText.toLowerCase();
    let score = 0;
    
    for (const token of searchTokens) {
        if (targetLower.includes(token)) {
            // 完全匹配得分最高
            if (targetLower === token) {
                score += 10 * weight;
            } else if (targetLower.startsWith(token) || targetLower.endsWith(token)) {
                score += 5 * weight;
            } else {
                score += Math.max(1, token.length) * weight; // 根据匹配长度给分
            }
        }
    }
    
    return score;
}

/**
 * 搜索文章 - 先精确搜索，结果不足时进行模糊搜索
 */
export async function searchArticles(
    query: string,
    options: any = {}
): Promise<DbResult<ArticleClient[]> & { fuzzySearchInfo?: any }> {
    try {
        const articlesCollection = await getCollection<ArticleSchema>(COLLECTION_NAME);
        
        const {
            limit = 20,
            skip = 0,
            status = 'published',
            includeBody = false,
            searchType = 'all'
        } = options;

        // 构建投影
        const projection: any = {
            _id: 1,
            title: 1,
            summary: 1,
            tags: 1,
            authorId: 1,
            authorName: 1,
            createdAt: 1,
            status: 1,
            likes: 1
        };

        if (includeBody) {
            projection.body = 1;
        }

        // 第一步：精确搜索
        let exactSearchQuery: any = {};
        
        switch (searchType) {
            case 'title':
                exactSearchQuery.title = { $regex: query, $options: 'i' };
                break;
            case 'tags':
                exactSearchQuery.tags = { $in: [new RegExp(query, 'i')] };
                break;
            case 'author':
                exactSearchQuery.authorName = { $regex: query, $options: 'i' };
                break;
            case 'content':
                exactSearchQuery.body = { $regex: query, $options: 'i' };
                break;
            case 'all':
            default:
                exactSearchQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { summary: { $regex: query, $options: 'i' } },
                    { body: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } },
                    { authorName: { $regex: query, $options: 'i' } }
                ];
                break;
        }

        // 添加状态过滤
        if (status !== 'all') {
            exactSearchQuery.status = status;
        }

        // 执行精确搜索
        const exactResults = await articlesCollection
            .find(exactSearchQuery, { projection })
            .sort({ createdAt: -1 })
            .limit(50) // 获取更多结果用于判断
            .toArray();

        let allResults = exactResults;
        let fuzzySearchInfo: any = {
            originalQuery: query,
            originalTerm: query,
            exactCount: exactResults.length,
            fuzzyCount: 0,
            isFuzzySearch: false,
            tokens: [] as string[]
        };

        // 第二步：如果精确搜索结果少于3个，进行模糊搜索
        if (exactResults.length < 3) {
            const searchTokens = characterTokenize(query);
            fuzzySearchInfo.tokens = searchTokens;
            fuzzySearchInfo.isFuzzySearch = exactResults.length === 0; // 只有精确搜索为0时才显示提示

            if (searchTokens.length > 1) {
                const regexPatterns = searchTokens.slice(1).map(token => new RegExp(token, 'i')); // 排除完整词，避免重复
                
                let fuzzySearchQuery: any = {};
                
                switch (searchType) {
                    case 'title':
                        fuzzySearchQuery.$or = regexPatterns.map(pattern => ({ title: pattern }));
                        break;
                    case 'tags':
                        fuzzySearchQuery.$or = regexPatterns.map(pattern => ({ tags: { $in: [pattern] } }));
                        break;
                    case 'author':
                        fuzzySearchQuery.$or = regexPatterns.map(pattern => ({ authorName: pattern }));
                        break;
                    case 'content':
                        fuzzySearchQuery.$or = regexPatterns.map(pattern => ({ body: pattern }));
                        break;
                    case 'all':
                    default:
                        fuzzySearchQuery.$or = [
                            ...regexPatterns.map(pattern => ({ title: pattern })),
                            ...regexPatterns.map(pattern => ({ summary: pattern })),
                            ...regexPatterns.map(pattern => ({ body: pattern })),
                            ...regexPatterns.map(pattern => ({ tags: { $in: [pattern] } })),
                            ...regexPatterns.map(pattern => ({ authorName: pattern }))
                        ];
                        break;
                }

                // 添加状态过滤
                if (status !== 'all') {
                    fuzzySearchQuery.status = status;
                }

                // 排除已有的精确搜索结果
                const exactIds = exactResults.map(article => article._id);
                if (exactIds.length > 0) {
                    fuzzySearchQuery._id = { $nin: exactIds };
                }

                // 执行模糊搜索
                const fuzzyResults = await articlesCollection
                    .find(fuzzySearchQuery, { projection })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .toArray();

                fuzzySearchInfo.fuzzyCount = fuzzyResults.length;
                
                // 合并精确搜索和模糊搜索结果
                allResults = [...exactResults, ...fuzzyResults];
            }
        }

        // 计算相关性分数并排序（仅对模糊搜索结果）
        const resultsWithScores = allResults.map((article, index) => {
            let score = 0;
            
            if (index < exactResults.length) {
                // 精确搜索结果给予更高基础分数
                score = 1000 - index; // 按原始顺序，越早越高分
            } else {
                // 模糊搜索结果计算匹配分数
                const tokens = fuzzySearchInfo.tokens.slice(1); // 排除完整词
                score += calculateMatchScore(tokens, article.title, 3);
                score += calculateMatchScore(tokens, article.summary, 2);
                score += calculateMatchScore(tokens, article.authorName, 1.5);
                score += calculateMatchScore(tokens, article.tags?.join(' ') || '', 2);
                
                if (includeBody && article.body) {
                    score += calculateMatchScore(tokens, article.body, 1);
                }
            }

            return { article, score, isExact: index < exactResults.length };
        });

        // 排序：精确搜索结果优先，然后按分数排序
        resultsWithScores.sort((a, b) => {
            if (a.isExact && !b.isExact) return -1;
            if (!a.isExact && b.isExact) return 1;
            if (a.isExact && b.isExact) return a.score > b.score ? -1 : 1; // 精确搜索按原始顺序
            return b.score - a.score; // 模糊搜索按分数
        });

        // 分页处理
        const totalCount = resultsWithScores.length; // 总结果数
        const paginatedResults = resultsWithScores.slice(skip, skip + limit);
        
        const articlesForClient: ArticleClient[] = paginatedResults.map(({ article }) => ({
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

        return { 
            data: articlesForClient, 
            error: null,
            fuzzySearchInfo: {
                ...fuzzySearchInfo,
                totalCount
            }
        };

    } catch (error: any) {
        return {
            data: null,
            error: { code: 'SEARCH_ERROR', message: error.message },
            fuzzySearchInfo: {
                originalQuery: query,
                originalTerm: query,
                exactCount: 0,
                fuzzyCount: 0,
                tokens: [] as string[],
                isFuzzySearch: false
            }
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