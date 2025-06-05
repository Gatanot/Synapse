// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';
import { getLatestArticles } from '$lib/server/db/articleCollection';
/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {

    try {
        const latestArticles = await getLatestArticles({
            limit: 10,
            status: 'published',
            includeBody: false
        });

        if (!latestArticles) {
            console.warn('Failed to fetch latest articles, returning empty array.');
            return {
                articles: []
            };
        }

        return {
            articles: latestArticles
        };
    } catch (err) {
        console.error('Error in homepage load function:', err);
        return {
            articles: [], // 返回空数组作为后备
            error: 'Failed to load articles. Please try again later.' // 可以传递一个错误消息
        };
    }
}