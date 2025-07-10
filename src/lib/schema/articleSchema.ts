/**
 * @fileoverview 文章数据模式定义
 * @description 定义文章集合的数据结构、状态类型和字段规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 文章状态联合类型
 * @typedef {string} ArticleStatus
 * @description 定义文章的发布状态
 * - 'draft': 草稿状态，仅作者可见
 * - 'published': 已发布状态，所有人可见
 */
export type ArticleStatus = 'draft' | 'published';

/**
 * 文章数据模式接口
 * @interface ArticleSchema
 * @description 定义articles集合中文档的完整结构
 * @property {ObjectId} _id - 文章唯一标识符
 * @property {string} title - 文章标题
 * @property {string} summary - 文章摘要/简介
 * @property {string[]} tags - 文章标签数组
 * @property {ObjectId} authorId - 作者用户ID，引用UserSchema._id
 * @property {string} authorName - 作者姓名，冗余存储以提高查询性能
 * @property {string} body - 文章正文内容
 * @property {Date} createdAt - 文章创建时间
 * @property {Date} updatedAt - 文章最后更新时间
 * @property {ObjectId[]} comments - 文章评论ID数组，引用comments集合
 * @property {ArticleStatus} status - 文章发布状态
 * @property {number} likes - 文章点赞数
 */
export interface ArticleSchema {
  _id: ObjectId;
  title: string;
  summary: string;
  tags: string[];
  authorId: ObjectId;
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  comments: ObjectId[];
  status: ArticleStatus;
  likes: number;
}