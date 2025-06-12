import { error } from '@sveltejs/kit';
import { getArticlesByUserId } from '$lib/server/db/articleCollection';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { _id } = params;

    if (!_id) {
        throw error(400, 'User ID is required.');
    }

    try {
        const { data: articlesFromDb, error: dbError } = await getArticlesByUserId(_id, { includeBody: false });

        if (dbError) {
            console.error(`Error fetching articles for user ID ${_id}:`, dbError.message);
            if (dbError.code === 'INVALID_ID_FORMAT') {
                throw error(404, 'User not found.');
            }
            throw error(500, 'Failed to fetch article list.');
        }

        if (!articlesFromDb || articlesFromDb.length === 0) {
            return { articles: [] };
        }

        return { articles: articlesFromDb };

    } catch (err: any) {
        if (err.status) {
            throw err;
        }
        console.error(`Unexpected error processing request for user ID ${_id}:`, err);
        throw error(500, 'An unexpected error occurred.');
    }
};