import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getArticleById } from '$lib/server/db/articleCollection';
import type { PageServerLoad } from './$types';
import { mapArticleToClient } from '$lib/types/share';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        // 用户未登录，重定向到登录页面
        throw redirect(303, '/login');
    }

    const { _id } = params;

    if (!_id) {
        throw error(400, 'Article ID is required.');
    }

    let { data: article, error: fetchError } = await getArticleById(_id);

    if (fetchError) {
        throw error(500, 'Failed to fetch article.');
    }

    if (!article) {
        throw error(404, `Article with ID ${_id} not found.`);
    }

    let articletoclient = mapArticleToClient(article);

    return { data:articletoclient };
};
