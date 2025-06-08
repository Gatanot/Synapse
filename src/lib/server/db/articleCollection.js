import { getCollection, getClient, ObjectId } from './db'; // 从你的 db.js 导入
const COLLECTION_NAME = 'articles';

/**
 * 为 articles 集合创建必要的索引
 * 这个函数应该在你的 db.js 的 ensureIndexes 函数中被调用
 */
export async function ensureArticleIndexes() {
    try {
        const articlesCollection = await getCollection(COLLECTION_NAME);

        // 根据 authorId 查询文章
        await articlesCollection.createIndex({ authorId: 1 });
        console.log("Index on articles.authorId ensured.");

        // 根据 tags 查询文章 (数组字段索引)
        await articlesCollection.createIndex({ tags: 1 });
        console.log("Index on articles.tags ensured.");

        // 根据 status 查询文章
        await articlesCollection.createIndex({ status: 1 });
        console.log("Index on articles.status ensured.");

    } catch (error) {
        // 在启动脚本中，抛出错误是合适的，以便终止有问题的启动过程
        throw error;
    }
}
/**
 * 创建一篇新文章，并以事务方式将其 ID 添加到对应用户的 `articles` 数组中。
 *
 * @param {Omit<ArticleSchema, '_id' | 'createdAt' | 'updatedAt' | 'comments' | 'likes' | 'status'> & { status?: 'draft' | 'published' }} articleData - 要创建的文章数据。
 * @returns {Promise<{data: import('mongodb').InsertOneResult | null, error: {code: string, message: string} | null}>} 操作结果。
 */
export async function createArticle(articleData) {
    const client = getClient();
    const session = client.startSession(); // 启动一个会话

    try {
        let creationResult = null;

        // 使用 withTransaction API，它会自动处理提交和中止逻辑
        await session.withTransaction(async () => {
            // 1. 准备并插入新文章
            const articlesCollection = await getCollection(COLLECTION_NAME);
            const currentTime = new Date();
            const authorObjectId = new ObjectId(articleData.authorId);

            /** @type {Omit<ArticleSchema, '_id'>} */
            const newArticle = {
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

            const result = await articlesCollection.insertOne(newArticle, { session });

            if (!result.insertedId) {
                // 如果插入失败，抛出错误以中止事务
                throw new Error('Article insertion did not return an insertedId.');
            }

            // 将结果保存在事务外部的变量中，以便返回
            creationResult = result;
            const newArticleId = result.insertedId;

            // 2. 将新文章的 ID 添加到用户的 `articles` 数组
            // 这个函数内部会处理用户未找到的情况并抛出错误，从而中止事务
            await addArticleToUser(authorObjectId, newArticleId, { session });

            console.log(`Transaction successful: Article ${newArticleId} created and linked to user ${authorObjectId}.`);
        });

        // 如果事务成功，creationResult 将会有值
        if (creationResult) {
            return { data: creationResult, error: null };
        } else {
            // 理论上，如果事务成功，这里不应该被执行
            return { data: null, error: { code: 'UNKNOWN_TRANSACTION_ERROR', message: 'Transaction completed, but result is missing.' } };
        }

    } catch (error) {
        console.error('Error during article creation transaction:', error);
        return {
            data: null,
            error: {
                code: 'TRANSACTION_ERROR',
                message: error.message || 'An unexpected error occurred during the article creation process.'
            }
        };
    } finally {
        // 确保会话在所有操作后都关闭
        await session.endSession();
    }
}

/**
 * 获取最新创建的指定数量的文章。
 *
 * @param {object} [options={}] - 查询选项
 * @param {number} [options.limit=10] - 要获取的文章数量
 * @param {number} [options.skip=0] - 跳过的文章数量 (用于分页)
 * @param {'draft' | 'published' | 'all'} [options.status='published'] - 要获取的文章状态
 * @param {boolean} [options.includeBody=false] - 是否在结果中包含完整的文章正文
 * @returns {Promise<{data: ArticleSchemaClient[], error: {code: string, message: string} | null}>} 包含文章对象的数组。
 */
export async function getLatestArticles(options = {}) {
    const {
        limit = 10,
        skip = 0,
        status = 'published',
        includeBody = false
    } = options;

    try {
        const articlesCollection = await getCollection(COLLECTION_NAME);

        const query = {};
        if (status !== 'all') {
            query.status = status;
        }

        const projection = {
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

        const articlesCursor = articlesCollection
            .find(query)
            .project(projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const articlesFromDb = await articlesCursor.toArray();

        const articlesForClient = articlesFromDb.map(article => {
            /** @type {ArticleSchemaClient} */
            const clientArticle = {
                ...article,
                _id: article._id.toString(),
                authorId: article.authorId.toString(),
            };
            if (!includeBody && clientArticle.body !== undefined) {
                delete clientArticle.body;
            }
            return clientArticle;
        });

        return { data: articlesForClient, error: null };

    } catch (error) {
        console.error('Error fetching latest articles:', error);
        // 即使出错，也返回一个空数组，保持 data 字段的类型一致性
        return { data: null, error: { code: 'DB_ERROR', message: error.message || 'An unexpected error occurred while fetching articles.' } };
    }
}