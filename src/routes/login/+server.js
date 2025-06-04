import { findUserByEmail } from '$lib/server/db/userCollection';
import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs'; // <--- 引入 bcryptjs
import crypto from 'node:crypto'; // <--- 引入 crypto 用于生成会话 ID

let MOCK_SESSIONS_DB = {};
/**
 * 验证密码 (与注册时的哈希逻辑对应)
 * @param {string} password 用户登录时提交的密码
 * @param {string} salt 从数据库中获取的用户盐
 * @param {string} hashedPassword 从数据库中获取的哈希密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
async function verifyPassword(password, salt, hashedPassword) {
    if (!password || !salt || !hashedPassword) {
        console.warn("verifyPassword: Missing one or more required parameters.");
        return false;
    }
    // 将明文密码与 salt 拼接
    const stringToCompare = password + salt;

    // bcrypt.compare 比较
    try {
        return await bcrypt.compare(stringToCompare, hashedPassword);
    } catch (error) {
        console.error("Error during bcrypt.compare:", error);
        return false;
    }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. 输入验证
        if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
            return json({ success: false, message: '邮箱和密码不能为空。' }, { status: 400 });
        }

        // 2. 查找用户 (实际应查询数据库) 
        const user = await findUserByEmail(email)

        if (!user) {
            return json({ success: false, message: '邮箱或密码错误。' }, { status: 401 });
        }

        // 3. 验证密码
        const isPasswordValid = await verifyPassword(password, user.salt, user.password);

        if (!isPasswordValid) {
            return json({ success: false, message: '邮箱或密码错误。' }, { status: 401 });
        }

        // 4. 创建会话 
        const sessionId = crypto.randomUUID();
        const sessionExpiryMs = 1000 * 60 * 60 * 24 * 7;
        const expiresAt = new Date(Date.now() + sessionExpiryMs);

        MOCK_SESSIONS_DB[sessionId] = {
            _id: user._id.toString(),
            email: user.email,
            expiresAt: expiresAt.toISOString()
        };

        // 5. 设置会话 Cookie
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: sessionExpiryMs / 1000
        });

        return json({
            success: true,
            message: '登录成功！',
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                articles: user.articles,
            }
        }, { status: 200 });

    } catch (error) {
        console.error('登录处理错误:', error);
        if (error instanceof SyntaxError) {
            return json({ success: false, message: '请求格式错误。' }, { status: 400 });
        }
        return json({ success: false, message: '服务器内部错误，请稍后重试。' }, { status: 500 });
    }
}