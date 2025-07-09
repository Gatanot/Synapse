import type { ObjectId } from 'mongodb';

/**
 * 代表 'admins' 集合中的文档结构。
 * 用于存储管理员信息。
 */
export interface AdminSchema {
    _id: ObjectId;
    userId: ObjectId; // 对应用户ID，关联到UserSchema的_id字段
    priority: number; // 管理员分类；1:普通管理员，0:超级管理员
    createdAt: Date;
    updatedAt: Date;
}