/**
 * @fileoverview 邮件发送服务模块
 * @description 提供邮件发送功能，用于用户注册验证码和系统通知
 * @author Synapse Team
 * @since 2025-01-01
 */

import nodemailer from 'nodemailer';

// SMTP邮件传输器配置
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
        user: '2971411759@qq.com',
        pass: 'mqjgbwjyrdmqdhdb'
    }
});

/**
 * 发送邮件
 * @description 通过SMTP服务器发送邮件
 * @param {string} to - 收件人邮箱地址
 * @param {string} subject - 邮件主题
 * @param {string} text - 邮件文本内容
 * @throws {Error} 当邮件发送失败时抛出错误
 */
export async function sendMail(to: string, subject: string, text: string) {
    await transporter.sendMail({
        from: '"Synapse" <2971411759@qq.com>', 
        to,
        subject,
        text
    });
}
