import { connectToDatabase, ensureIndexes } from '$lib/server/db/db';
import { findUserById } from '$lib/server/db/userCollection';
import { findSessionById, deleteSessionById } from '$lib/server/db/sessionCollection';
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
        const { data: session, error: sessionError } = await findSessionById(sessionId);

        if (sessionError) {
            console.error('Error finding session:', sessionError.message);
        }
        else if (session) {
            const { data: user, error: userError } = await findUserById(session.userId.toString());

            if (userError) {
                console.error('Error finding user associated with session:', userError.message);
            }
            else if (user) {
                event.locals.user = {
                    _id: session.userId.toString(),
                    email: session.userData.email,
                    name: session.userData.name,
                    articles: session.userData.articles || []
                };
            }
            else {
                console.warn(`Data inconsistency: Session ${sessionId} found, but user ${session.userId.toString()} is missing. Cleaning up.`);
                await deleteSessionById(sessionId);
                event.cookies.delete('sessionId', { path: '/' });
            }
        }
        else {
            event.cookies.delete('sessionId', { path: '/' });
        }
    }

    // 继续处理请求
    const response = await resolve(event);
    return response;
}