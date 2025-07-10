/**
 * @fileoverview 服务端类型导出入口
 * @description 统一导出服务端专用的数据结构和配置类型
 * @author Synapse Team
 * @since 2025-01-01
 */

export * from './articleServer';

/** 搜索类型枚举 */
export type SearchType = 'all' | 'title' | 'tags' | 'content' | 'author';

/**
 * 搜索配置选项
 * @description 定义文章搜索功能的配置参数
 */
export interface SearchOptions {
    /** 返回结果数量限制 */
    limit?: number;
    /** 跳过的结果数量（用于分页） */
    skip?: number;
    /** 文章状态过滤 */
    status?: 'published' | 'draft' | 'all';
    /** 是否包含文章正文内容 */
    includeBody?: boolean;
    /** 搜索类型 */
    searchType?: SearchType;
}