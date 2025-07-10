export * from './articleServer';

// 添加搜索类型
export type SearchType = 'all' | 'title' | 'tags' | 'content' | 'author';

export interface SearchOptions {
    limit?: number;
    skip?: number;
    status?: 'published' | 'draft' | 'all';
    includeBody?: boolean;
    searchType?: SearchType;
}