// src/routes/dashboard/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'; // 导入类型

// 使用导入的类型来注解 load 函数
export const load: PageServerLoad = async ({ locals }) => {
    // 这里的 locals.user 现在会受到 app.d.ts 中定义的类型检查
    if (!locals.user) {
        // 用户未登录，重定向到登录页面
        throw redirect(303, '/login');
    }

    // 如果检查通过，返回的用户数据也会是类型安全的
    return {
        user: locals.user
    };
};