import { findUserById } from '$lib/server/db/userCollection';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
    const id = params.id;
    if (!id) {
        return new Response(
            JSON.stringify({ exists: false }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }
    const result = await findUserById(id);
    return new Response(
        JSON.stringify({ exists: !!result.data }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}; 