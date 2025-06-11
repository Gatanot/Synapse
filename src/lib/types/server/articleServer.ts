import type { ArticleStatus } from "$lib/schema";
/**
 *   getLatestArticles 函数的选项类型。
 */
export interface GetArticlesOptions {
    limit?: number;
    skip?: number;
    status?: ArticleStatus | 'all';
    includeBody?: boolean;
}