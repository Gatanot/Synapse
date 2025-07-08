import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com', // SMTP服务器地址
    port: 587,           // 端口号，465为SSL
    secure: false,        // 使用SSL
    auth: {
        user: '2971411759@qq.com',      // 邮箱账号
        pass: 'mqjgbwjyrdmqdhdb'    // 邮箱授权码
    }
});

export async function sendMail(to: string, subject: string, text: string) {
    await transporter.sendMail({
        from: '"Synapse" <2971411759@qq.com>', 
        to,
        subject,
        text
    });
}
