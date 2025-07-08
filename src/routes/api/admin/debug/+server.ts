import { json } from '@sveltejs/kit';
import { getAdminStats } from '$lib/server/utils/adminStats';
import { getCollection } from '$lib/server/db/db';
import type { UserSchema, ArticleSchema, CommentSchema } from '$lib/schema';

export async function GET() {
    try {
        // 获取统计数据
        const stats = await getAdminStats();
        
        // 获取一些示例数据来验证连接
        const [usersCollection, articlesCollection, commentsCollection] = await Promise.all([
            getCollection<UserSchema>('users'),
            getCollection<ArticleSchema>('articles'),
            getCollection<CommentSchema>('comments')
        ]);
        
        const [sampleUsers, sampleArticles, sampleComments] = await Promise.all([
            usersCollection.find({}).limit(3).toArray(),
            articlesCollection.find({}).limit(3).toArray(),
            commentsCollection.find({}).limit(3).toArray()
        ]);
        
        return json({
            stats,
            samples: {
                users: sampleUsers.map(user => ({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                })),
                articles: sampleArticles.map(article => ({
                    _id: article._id,
                    title: article.title,
                    authorId: article.authorId,
                    createdAt: article.createdAt
                })),
                comments: sampleComments.map(comment => ({
                    _id: comment._id,
                    content: comment.content?.substring(0, 50) + '...',
                    articleId: comment.articleId,
                    createdAt: comment.createdAt
                }))
            },
            databaseInfo: {
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        });
    } catch (error) {
        console.error('Database debug error:', error);
        return json({
            error: 'Failed to fetch database information',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
