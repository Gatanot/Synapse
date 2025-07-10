// src/routes/login/+server.ts (假设这是登录路由)

import { findUserByEmail } from '$lib/server/db/userCollection';
import { json } from '@sveltejs/kit';
import { createSession } from '$lib/server/db/sessionCollection';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';
import type { UserLoginShare } from '$lib/types/share'; // 假设登录DTO

// 我们需要一个 UserLoginShare 类型来定义请求体
// 你可以把它添加到 `src/lib/types/userShared.ts` 或类似文件中
/*
// 在 src/lib/types/userShared.ts 中添加:
export interface UserLoginShare {
    email: string;
    password: string;
}
*/

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const body: UserLoginShare = await request.json();
        const { email, password } = body;

        // 1. 输入验证
        if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
            return json({ success: false, message: '邮箱和密码不能为空。' }, { status: 400 });
        }

        // 2. 查找用户
        const { data: user, error } = await findUserByEmail(email);

        if (error) {
            console.error('Database error while trying to find user:', error);
            return json({ success: false, message: '服务器内部错误，请稍后重试。' }, { status: 500 });
        }

        // 3. 验证用户和密码
        // 使用 bcrypt.compare 来安全地比较明文密码和数据库中的哈希密码
        // 如果用户不存在，或者密码不匹配，都返回相同的通用错误信息以防止用户枚举攻击
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return json({ success: false, message: '邮箱或密码错误。' }, { status: 401 });
        }

        // 4. 创建会话
        const sessionExpiryMs = 1000 * 60 * 60 * 24 * 7; // 7 days
        const { data: sessionData, error: sessionError } = await createSession(
            user._id.toString(),
            { // SessionUserData
                name: user.name,
                email: user.email,
                articles: user.articles,
                likes: user.likes // 新增 likes 字段
            },
            sessionExpiryMs
        );

        if (sessionError || !sessionData) {
            console.error('Session creation failed:', sessionError);
            return json({ success: false, message: '登录失败：无法创建您的会话，请稍后重试。' }, { status: 500 });
        }

        const { sessionId, expiresAt } = sessionData;

        // 5. 设置会话 Cookie
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt
        });

        return json({
            success: true,
            message: '登录成功！',
        }, { status: 200 });

    } catch (err: any) {
        console.error('登录处理错误:', err);
        if (err instanceof SyntaxError) {
            return json({ success: false, message: '请求格式错误。' }, { status: 400 });
        }
        return json({ success: false, message: '服务器内部错误，请稍后重试。' }, { status: 500 });
    }
};