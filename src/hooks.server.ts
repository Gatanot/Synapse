// src/hooks.server.ts

import { connectToDatabase, initializeDatabase, findUserById, findSessionById, deleteSessionById, } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import type { UserClient } from '$lib/types/client'; // 确保 UserClient 定义了我们期望的字段

// 服务启动时的数据库初始化逻辑
// 这是一个立即调用的异步函数表达式 (IIFE)
(async () => {
    try {
        console.log('Server starting: Initializing database connection and ensuring indexes...');
        await initializeDatabase();
        console.log('Database connection successful and indexes ensured.');
    } catch (error) {
        console.error('CRITICAL: Failed to initialize database or ensure indexes during server startup.', error);
        // 在关键初始化失败时退出进程
        process.exit(1);
    }
})();

/**
 * SvelteKit 的 handle 钩子，处理所有服务端请求。
 * 它会验证用户的会话，并将用户信息附加到 `event.locals`。
 */
export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get('sessionId');
    event.locals.user = null; // 初始化，现在这是类型安全的

    if (sessionId) {
        const { data: session, error: sessionError } = await findSessionById(sessionId);

        if (sessionError) {
            console.error('Error finding session:', sessionError.message);
        } else if (session) {
            // session.userId 是 ObjectId，需要转换为字符串来调用 findUserById
            const userIdString = session.userId.toString();
            const { data: user, error: userError } = await findUserById(userIdString);

            if (userError) {
                console.error('Error finding user associated with session:', userError.message);
            } else if (user) {
                // 构建符合 UserClient 接口的对象并附加到 locals
                // 这是类型安全的关键点
                const userForClient: UserClient = {
                    _id: user._id.toString(),
                    email: user.email, // 我们从 user schema 中获取 email
                    name: user.name,   // 和 name，而不是 session.userData，以保证数据最新
                    // articles 数组中的 ObjectId 需要转换为字符串
                    articles: user.articles?.map(id => id.toString()) || [],
                    // likes 数组中的 ObjectId 需要转换为字符串，如果字段不存在则使用空数组
                    likes: user.likes?.map(id => id.toString()) || [],
                    signature: user.signature, // 个人签名，默认为空字符串
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                };
                event.locals.user = userForClient;

            } else {
                // 数据不一致：存在会话但找不到对应的用户
                console.warn(`Data inconsistency: Session ${sessionId} found, but user ${userIdString} is missing. Cleaning up.`);
                await deleteSessionById(sessionId);
                event.cookies.delete('sessionId', { path: '/' });
            }
        } else {
            // 会话ID无效或已过期，清理cookie
            event.cookies.delete('sessionId', { path: '/' });
        }
    }

    // 继续处理请求
    const response = await resolve(event);
    return response;
};