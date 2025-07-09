import type { ObjectId } from 'mongodb';

/**
 *   文章状态的联合类型。
 * 'draft': 草稿，仅作者可见
 * 'published': 已发布，所有人可见
 */
export type ArticleStatus = 'draft' | 'published';

/**
 *   代表 'articles' 集合中的文档结构。
 */
export interface ArticleSchema {
  _id: ObjectId;
  title: string;
  summary: string;
  tags: string[];
  authorId: ObjectId; // 引用 UserSchema 的 _id
  authorName: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  comments: ObjectId[]; // 假设引用一个 'comments' 集合
  status: ArticleStatus;
  likes: number;
}