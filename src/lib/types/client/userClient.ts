/**
 * @fileoverview 用户客户端类型定义
 * @description 定义用户在客户端使用的数据结构，用于前端组件渲染
 * @author Synapse Team
 * @since 2025-01-01
 */

import { ObjectId } from 'mongodb';

/**
 * 用户客户端数据结构
 * @description 用户集合文档在客户端的表示形式，_id转换为字符串便于前端处理
 */
export interface UserClient {
    /** 用户ID（字符串形式） */
    _id: string;
    /** 用户姓名 */
    name: string;
    /** 邮箱地址 */
    email: string;
    /** 用户发布的文章ID列表 */
    articles: string[];
    /** 用户点赞的文章ID列表 */
    likes: string[];
    /** 用户个人签名 */
    signature: string;
    /** 账户创建时间 */
    createdAt: Date;
    /** 最后更新时间 */
    updatedAt: Date;
}