// src/routes/api/verify-code/+server.ts
import { json } from '@sveltejs/kit';
import { sendMail } from '$lib/server/utils/sendMail';
import { saveRegisterCode, checkRegisterCode } from '$lib/server/db/verifyCode';
import { getCollection } from '$lib/server/db/db';
import type { RegisterCodeSchema } from '$lib/schema/verifyCodeSchema';
import type { RequestHandler } from './$types';

const CODE_EXPIRE_SECONDS = 600; // 验证码有效期10分钟（600秒）
const CODE_RESEND_COOLDOWN = 60; // 重新发送验证码冷却60秒

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const { email, action, code } = body;
    if (!email) return json({ success: false, message: '邮箱不能为空' }, { status: 400 });

    // 1. 发送验证码
    if (action === 'send') {
        const codes = await getCollection<RegisterCodeSchema>('register_codes');
        const now = new Date();
        const last = await codes.findOne({ email });
        // 判断是否在冷却期内（60秒内不能重复发送）
        if (last && last.expiresAt > now) {
            // 计算上次发送时间
            const lastSendTime = new Date(last.expiresAt.getTime() - CODE_EXPIRE_SECONDS * 1000);
            if (now.getTime() - lastSendTime.getTime() < CODE_RESEND_COOLDOWN * 1000) {
                return json({ success: false, message: '请勿频繁获取验证码，请稍后再试。' }, { status: 429 });
            }
        }
        // 生成新验证码并替换原有验证码
        const genCode = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await sendMail(email, '注册验证码', `您的验证码是：${genCode}，10分钟内有效`);
            await saveRegisterCode(email, genCode, CODE_EXPIRE_SECONDS); // saveRegisterCode 已实现 upsert，会替换原有验证码
            return json({ success: true, message: '验证码已发送' });
        } catch (err: any) {
            console.error('发送验证码失败:', err);
            return json({ success: false, message: '服务器内部错误: ' + (err?.message || err) }, { status: 500 });
        }
    }

    // 2. 校验验证码
    if (action === 'verify') {
        try {
            if (!code) return json({ success: false, message: '验证码不能为空' }, { status: 400 });
            const valid = await checkRegisterCode(email, code);
            if (!valid) {
                return json({ success: false, message: '验证码错误或已过期' }, { status: 400 });
            }
            return json({ success: true, message: '验证码校验成功' });
        } catch (err: any) {
            console.error('验证码校验失败:', err);
            return json({ success: false, message: '服务器内部错误: ' + (err?.message || err) }, { status: 500 });
        }
    }

    return json({ success: false, message: '未知操作' }, { status: 400 });
};
