import type { LayoutServerLoad } from './$types';

/**
 * 为根布局加载通用数据。
 * 这个函数会在每个页面加载时运行，为所有页面提供共享数据。
 */
export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user ?? null
    };
};