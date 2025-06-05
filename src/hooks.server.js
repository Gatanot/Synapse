import { connectToDatabase, ensureIndexes } from '$lib/server/db/db';
import { findUserById } from '$lib/server/db/userCollection';
import { findSessionById } from '$lib/server/db/sessionCollection';
(async () => {
    try {
        console.log('Server starting: Initializing database connection and ensuring indexes...');
        // 1. 首先确保数据库连接成功
        await connectToDatabase();
        // 2. 然后检查/创建索引
        await ensureIndexes();
        console.log('Database connection successful and indexes ensured.');
    } catch (error) {
        console.error('CRITICAL: Failed to initialize database or ensure indexes during server startup.', error);
        process.exit(1);
    }
})();
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const sessionId = event.cookies.get('sessionId');
    event.locals.user = null; // 初始化，默认用户未登录

    if (sessionId) {
        const session = await findSessionById(sessionId);
        if (session) {
            const user = await findUserById(session.userId.toString())
            if (user) {
                event.locals.user = {
                    id: session.userId.toString(),
                    email: session.userData.email,
                    name: session.userData.name,
                    articles: session.userData.articles || []
                };
            }
            else {
                // 用户在数据库中找不到了，可能是个异常情况，清除会话
                await deleteSessionById(sessionId);
                event.cookies.delete('sessionId', { path: '/' });
                event.locals.user = null;
            }
        } else {
            event.cookies.delete('sessionId', { path: '/' });
        }
    }

    // 继续处理请求
    const response = await resolve(event);
    return response;
}