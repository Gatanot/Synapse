// src/routes/register/+server.ts

import { json } from '@sveltejs/kit';
import { createUser } from '$lib/server/db/userCollection';
import { createSession } from '$lib/server/db/sessionCollection';
import type { RequestHandler } from './$types';
import type { UserRegisterShare } from '$lib/types/share'; // 使用我们已有的 DTO

export const POST: RequestHandler = async ({ request, cookies }) => {
    let userData: UserRegisterShare;
    try {
        userData = await request.json();
    } catch (error) {
        console.warn('Register: Failed to parse JSON body', error);
        return json({ success: false, message: '请求数据格式错误，请发送 JSON 数据。' }, { status: 400 });
    }

    const { email, name, password } = userData;

    // --- 输入验证 ---
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return json({ success: false, field: 'email', message: '邮箱地址不能为空。' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return json({ success: false, field: 'name', message: '用户名称不能为空。' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return json({ success: false, field: 'password', message: '密码长度至少为6位。' }, { status: 400 });
    }

    try {
        // --- 创建用户 ---
        // 我们之前已经更新了 createUser 函数，它内部会处理密码哈希
        // 所以这里直接传递明文密码即可
        const { data: createResult, error: createError } = await createUser({
            email: email.trim(),
            name: name.trim(),
            password: password, // createUser 内部会哈希它
        });

        if (createError) {
            let statusCode = 500;
            switch (createError.code) {
                case 'EMAIL_EXISTS':
                    statusCode = 409; // Conflict
                    break;
                case 'VALIDATION_ERROR':
                case 'INVALID_INPUT':
                    statusCode = 400; // Bad Request
                    break;
                case 'DB_ERROR':
                default:
                    statusCode = 500; // Internal Server Error
                    break;
            }
            return json({ success: false, message: createError.message }, { status: statusCode });
        }

        if (!createResult || !createResult.insertedId) {
            return json({ success: false, message: '用户注册失败，发生了未知的服务端错误。' }, { status: 500 });
        }

        const newUserId = createResult.insertedId;

        // --- 注册成功后，自动创建会话并登录 ---
        const sessionExpiryMs = 1000 * 60 * 60 * 24 * 7; // 7 days
        const { data: sessionData, error: sessionError } = await createSession(
            newUserId.toString(),
            { // SessionUserData
                name: name.trim(),
                email: email.trim().toLowerCase(),
                articles: [], // 新用户没有文章
                likes: [], // 新用户没有点赞
                signature: '' // 新用户没有签名
            },
            sessionExpiryMs
        );

        if (sessionError || !sessionData) {
            // 虽然用户创建成功，但会话创建失败。
            // 这是一个边缘情况。我们可以选择让用户手动登录，并返回一个特殊的成功消息。
            console.error(`User ${newUserId} created, but session creation failed:`, sessionError);
            return json({
                success: true,
                sessionCreated: false, // 告知前端会话创建失败
                message: '注册成功，但自动登录失败。请手动登录。',
                userId: newUserId.toString()
            }, { status: 201 }); // 201 Created
        }

        const { sessionId, expiresAt } = sessionData;

        // 设置会话 Cookie
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt
        });

        // 完全成功
        return json({
            success: true,
            sessionCreated: true,
            message: '用户注册成功并已自动登录！',
            userId: newUserId.toString()
        }, { status: 201 }); // 201 Created

    } catch (err: any) {
        console.error('Error during user registration process:', err);
        return json({ success: false, message: '服务器内部错误，请稍后再试。' }, { status: 500 });
    }
};