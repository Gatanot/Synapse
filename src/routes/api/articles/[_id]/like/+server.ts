import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getCollection, getClient } from '$lib/server/db/db';
import type { UserSchema, ArticleSchema } from '$lib/schema';
import type { RequestHandler } from './$types';
import { getArticleById } from '$lib/server/db/articleCollection';
import { insertMessage } from '$lib/server/db/messageCollection';

export const POST: RequestHandler = async ({ params, locals }) => {
    const { _id } = params;

    // 验证用户是否登录
    if (!locals.user) {
        return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    // 验证文章 ID
    if (!_id || !ObjectId.isValid(_id)) {
        return json({ success: false, message: '无效的文章 ID' }, { status: 400 });
    }

    const client = getClient();
    const session = client.startSession();

    try {
        let result: any = null;

        await session.withTransaction(async () => {
            const usersCollection = await getCollection<UserSchema>('users');
            const articlesCollection = await getCollection<ArticleSchema>('articles');

            const userId = new ObjectId(locals.user!._id); // 使用非空断言，因为上面已经验证过
            const articleId = new ObjectId(_id);

            // 检查文章是否存在
            const article = await articlesCollection.findOne({ _id: articleId }, { session });
            if (!article) {
                throw new Error('文章不存在');
            }

            // 获取用户当前的点赞列表
            const user = await usersCollection.findOne({ _id: userId }, { session });
            if (!user) {
                throw new Error('用户不存在');
            }

            // 确保 likes 字段存在，如果不存在则初始化为空数组
            const userLikes = user.likes || [];
            const isLiked = userLikes.some(likeId => likeId.equals(articleId));

            if (isLiked) {
                // 取消点赞 - 在事务中同时更新用户和文章
                await usersCollection.updateOne(
                    { _id: userId },
                    {
                        $pull: { likes: articleId },
                        $set: { updatedAt: new Date() }
                    },
                    { session }
                );

                await articlesCollection.updateOne(
                    { _id: articleId },
                    {
                        $inc: { likes: -1 },
                        $set: { updatedAt: new Date() }
                    },
                    { session }
                );

                result = {
                    success: true,
                    action: 'unliked',
                    message: '取消点赞成功',
                    newLikesCount: article.likes - 1
                };
            } else {
                // 添加点赞 - 在事务中同时更新用户和文章
                await usersCollection.updateOne(
                    { _id: userId },
                    {
                        $addToSet: { likes: articleId },
                        $set: { updatedAt: new Date() }
                    },
                    { session }
                );

                await articlesCollection.updateOne(
                    { _id: articleId },
                    {
                        $inc: { likes: 1 },
                        $set: { updatedAt: new Date() }
                    },
                    { session }
                );

                result = {
                    success: true,
                    action: 'liked',
                    message: '点赞成功',
                    newLikesCount: article.likes + 1
                };

                // 写入消息集合，通知文章作者
                const { data: articleInfo } = await getArticleById(_id);
                if (articleInfo && locals.user) {
                  await insertMessage({
                    userId: new ObjectId(articleInfo.authorId),
                    type: 'like',
                    articleId: new ObjectId(articleInfo._id),
                    articleTitle: articleInfo.title,
                    fromUserId: new ObjectId(locals.user._id),
                    fromUserName: locals.user.name,
                    createdAt: new Date(),
                    isRead: false
                  });
                }
            }
        });

        return json(result);
    } catch (error: any) {
        console.error('点赞操作失败:', error);
        return json(
            {
                success: false,
                message: error.message || '服务器错误'
            },
            { status: 500 }
        );
    } finally {
        await session.endSession();
    }
};