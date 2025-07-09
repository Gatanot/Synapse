import type { ArticleStatus } from "$lib/schema";

/**
 * 搜索类型枚举
 */
export type SearchType = 'all' | 'title' | 'tags' | 'author' | 'content';

/**
 * getLatestArticles 函数的选项类型。
 */
export interface GetArticlesOptions {
    limit?: number;
    skip?: number;
    status?: ArticleStatus | 'all';
    includeBody?: boolean;
}

/**
 * 搜索选项类型
 */
export interface SearchOptions extends GetArticlesOptions {
    searchType?: SearchType;
}