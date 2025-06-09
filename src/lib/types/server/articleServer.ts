import type { ArticleStatus } from "$lib/schema";
/**
 * @description getLatestArticles 函数的选项类型。
 */
export interface GetArticlesOptions {
    limit?: number;
    skip?: number;
    status?: ArticleStatus | 'all';
    includeBody?: boolean;
}