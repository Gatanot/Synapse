// src/routes/password/forget/+server.ts
import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/server/db/db';
import type { UserSchema } from '$lib/schema/userSchema';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export const POST: import('@sveltejs/kit').RequestHandler = async ({ request }) => {
    try {
        const { email, newPassword } = await request.json();
        if (!email || !newPassword) {
            return json({ success: false, message: '参数不完整' }, { status: 400 });
        }
        // 检查用户是否存在
        const users = await getCollection<UserSchema>('users');
        const user = await users.findOne({ email });
        if (!user) {
            return json({ success: false, message: '该邮箱未注册' }, { status: 404 });
        }
        // 更新密码
        const hashed = await hashPassword(newPassword);
        const result = await users.updateOne({ email }, { $set: { password: hashed, updatedAt: new Date() } });
        if (result.modifiedCount === 1) {
            return json({ success: true, message: '密码重置成功' });
        } else {
            return json({ success: false, message: '密码重置失败' }, { status: 500 });
        }
    } catch (err: any) {
        console.error('重置密码接口异常:', err);
        return json({ success: false, message: '服务器内部错误: ' + (err?.message || err) }, { status: 500 });
    }
};

