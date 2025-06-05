// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    if (!locals.user) {
        // 用户未登录，重定向到登录页面
        throw redirect(303, '/login'); // 或你的登录页路径
    }

    return {
        user: locals.user
    };
}