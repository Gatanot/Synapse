// src/app.d.ts

// 确保从正确的位置导入你的客户端用户类型
// 假设你已经创建了这个类型
import type { UserClient } from '$lib/types/client';

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            // 在这里定义你的自定义 locals 属性
            user: UserClient | null;
        }
        // interface PageData {}
        // interface Platform {}
    }
}

// 这一行也很重要，它确保文件被当作一个模块
export { };