import { getCollection, ObjectId } from './db'; // 从你的 db.js 导入
const COLLECTION_NAME = 'articles';

/**
 * 为 articles 集合创建必要的索引
 * 这个函数应该在你的 db.js 的 ensureIndexes 函数中被调用
 */
export async function ensureArticleIndexes() {
    try {
        const articlesCollection = await getCollection(COLLECTION_NAME)();

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
        throw error
    }
}

/**
 * 创建一篇新文章并将其插入数据库。
 *
 * @param {Omit<ArticleSchema, '_id' | 'createdAt' | 'updatedAt' | 'comments' | 'likes' | 'status'> & { status?: 'draft' | 'published' }} articleData - 要创建的文章数据。
 *   `authorId` 应该是一个有效的 ObjectId 实例或可以转换为 ObjectId 的字符串。
 *   `createdAt`, `updatedAt` 会自动设置。
 *   `comments` 和 `likes` 默认为空数组。
 *   `status` 默认为 'draft'，除非显式提供。
 * @returns {Promise<import('mongodb').InsertOneResult | null>} MongoDB 插入操作的结果，如果发生错误则返回 null。
 */
export async function createArticle(articleData) {
    try {
        const articlesCollection = await getCollection(COLLECTION_NAME);
        const currentTime = new Date();

        // 准备要插入数据库的完整文章对象
        /** @type {Omit<ArticleSchema, '_id'>} */
        const newArticle = {
            title: articleData.title,
            summary: articleData.summary,
            tags: articleData.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean), // 清理标签
            authorId: new ObjectId(articleData.authorId), // 确保 authorId 是 ObjectId
            authorName: articleData.authorName,
            body: articleData.body,
            createdAt: currentTime,
            updatedAt: currentTime,
            comments: [], // 初始化为空数组
            status: articleData.status || 'draft', // 默认为草稿状态
            likes: [] // 初始化为空数组
        };

        const result = await articlesCollection.insertOne(newArticle);

        if (result.insertedId) {
            console.log(`Article created successfully with ID: ${result.insertedId}`);
            return result;
        } else {
            console.warn('Article insertion did not return an insertedId.');
            return null; // 或者可以抛出错误
        }

    } catch (error) {
        console.error('Error creating article in articleCollection:', error);
        // 根据你的错误处理策略，这里可以返回 null，或者重新抛出错误
        // throw error; // 如果希望调用者处理
        return null;
    }
}
/**
 * 获取最新创建的指定数量的文章。
 * 默认获取10篇状态为 'published' 的文章。
 *
 * @param {object} [options={}] - 查询选项
 * @param {number} [options.limit=10] - 要获取的文章数量
 * @param {number} [options.skip=0] - 跳过的文章数量 (用于分页)
 * @param {'draft' | 'published' | 'all'} [options.status='published'] - 要获取的文章状态，'all' 表示所有状态
 * @param {boolean} [options.includeBody=false] - 是否在结果中包含完整的文章正文 (body)
 * @returns {Promise<ArticleSchemaClient[]>} 包含文章对象的数组，ObjectId 已转换为字符串。如果出错则返回空数组。
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

        // 构建投影 (projection) 来选择返回哪些字段
        const projection = {
            title: 1,
            summary: 1,
            tags: 1,
            authorId: 1,
            authorName: 1,
            createdAt: 1,
            createdAt: 1,
            status: 1,
        };

        if (includeBody) {
            projection.body = 1;
        }
        // 字段 _id 默认总是返回，除非显式设为 0

        const articlesCursor = articlesCollection
            .find(query)
            .project(projection)
            .sort({ createdAt: -1 }) // 按创建时间降序排序 (最新的在前)
            .skip(skip)
            .limit(limit);

        const articlesFromDb = await articlesCursor.toArray();

        // 将 ObjectId 转换为字符串
        const articlesForClient = articlesFromDb.map(article => {
            /** @type {ArticleSchemaClient} */
            const clientArticle = {
                ...article,
                _id: article._id.toString(),
                authorId: article.authorId.toString(),
            };
            // 如果投影中不包含 body，而原始 article 对象中有，则需要显式删除
            if (!includeBody && clientArticle.body !== undefined) {
                delete clientArticle.body;
            }
            return clientArticle;
        });

        return articlesForClient;

    } catch (error) {
        console.error('Error fetching latest articles:', error);
        return []; // 或者可以抛出错误让调用者处理
    }
}
