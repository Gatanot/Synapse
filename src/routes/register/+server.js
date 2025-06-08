import { json } from '@sveltejs/kit';
import { createUser } from '$lib/server/db/userCollection';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto'

const BCRYPT_SALT_ROUNDS = 10; // bcrypt 哈希工作因子
const CUSTOM_SALT_BYTE_LENGTH = 16; // salt 字节长度

/**
 * 处理用户注册请求 (POST /register)
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
    let userData;
    try {
        userData = await request.json();
    } catch (error) {
        console.warn('Register: Failed to parse JSON body', error);
        return json({ success: false, message: '请求数据格式错误，请发送 JSON 数据。' }, { status: 400 });
    }

    const { email, name, password } = userData;

    // 输入验证
    if (!email || typeof email !== 'string' || email.trim() === '') {
        return json({ success: false, field: 'email', message: '邮箱地址不能为空。' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return json({ success: false, field: 'name', message: '用户名称不能为空。' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return json({ success: false, field: 'password', message: '密码长度至少为6位。' }, { status: 400 });
    }
    // 生成 salt
    const customSalt = crypto.randomBytes(CUSTOM_SALT_BYTE_LENGTH).toString('hex');

    // 拼接
    const stringToHash = password + customSalt;
    try {
        // 哈希
        const hashedPassword = await bcrypt.hash(stringToHash, BCRYPT_SALT_ROUNDS);

        const newUserInput = {
            email: email.trim().toLowerCase(),
            name: name.trim(),
            salt: customSalt,
            password: hashedPassword,
        };

        const { data, error } = await createUser(newUserInput);

        if (error) {
            let errorMessage = error.message || '用户注册失败，请稍后再试。';
            let statusCode = 500;
            switch (error.code) {
                case 'EMAIL_EXISTS':
                    statusCode = 409;
                    break;
                case 'VALIDATION_ERROR':
                case 'INVALID_INPUT':
                    statusCode = 400;
                    break;
                case 'DB_ERROR':
                default:
                    statusCode = 500;
                    break;
            }
            return json({
                success: false,
                message: errorMessage
            }, { status: statusCode });
        }

        if (data && data.insertedId) {
            return json({
                success: true,
                message: '用户注册成功！',
                userId: data.insertedId.toString()
            }, { status: 201 });
        }

        return json({
            success: false,
            message: '用户注册失败，发生了未知的服务端错误。'
        }, { status: 500 });
    } catch (error) {
        console.error('Error during user registration process:', error);
        return json({ success: false, message: '服务器内部错误，请稍后再试。' }, { status: 500 });
    }
}