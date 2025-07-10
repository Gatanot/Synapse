/**
 * @fileoverview 用户数据模式定义
 * @description 定义用户集合的数据结构和字段规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 用户数据模式接口
 * @interface UserSchema
 * @description 定义users集合中文档的完整结构，用于数据库直接交互
 * @property {ObjectId} _id - 用户唯一标识符
 * @property {string} name - 用户姓名
 * @property {string} email - 用户邮箱地址，用于登录和通知
 * @property {string} password - 用户密码的哈希值
 * @property {ObjectId[]} articles - 用户发表的文章ID数组
 * @property {Date} createdAt - 账户创建时间
 * @property {Date} updatedAt - 账户最后更新时间
 * @property {ObjectId[]} likes - 用户点赞的文章ID数组
 * @property {string} signature - 用户个人签名
 */
export interface UserSchema {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  articles: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  likes: ObjectId[];
  signature: string;
}