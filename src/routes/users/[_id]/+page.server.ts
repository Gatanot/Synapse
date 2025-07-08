
import { error } from '@sveltejs/kit';
import { getArticlesByUserId } from '$lib/server/db/articleCollection';
import { findUserById } from '$lib/server/db/userCollection';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { _id } = params;

    if (!_id) {
        throw error(400, 'User ID is required.');
    }

    try {
        // 获取用户基本信息
        const { data: user, error: userError } = await findUserById(_id);
        if (userError || !user) {
            if (userError?.code === 'INVALID_ID') {
                throw error(404, 'User not found.');
            }
            throw error(500, 'Failed to fetch user info.');
        }

        // 获取文章
        const { data: articlesFromDb, error: dbError } = await getArticlesByUserId(_id, { includeBody: false });
        if (dbError) {
            console.error(`Error fetching articles for user ID ${_id}:`, dbError.message);
            if (dbError.code === 'INVALID_ID_FORMAT') {
                throw error(404, 'User not found.');
            }
            throw error(500, 'Failed to fetch article list.');
        }

        return {
            user: {
                name: user.name,
                email: user.email,
                signature: user.signature || ''
            },
            articles: articlesFromDb || []
        };

    } catch (err: any) {
        if (err.status) {
            throw err;
        }
        console.error(`Unexpected error processing request for user ID ${_id}:`, err);
        throw error(500, 'An unexpected error occurred.');
    }
};