/**
 * @fileoverview 管理员数据模式定义
 * @description 定义管理员集合的数据结构和权限级别规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 管理员数据模式接口
 * @interface AdminSchema
 * @description 定义admins集合中文档的完整结构，用于存储管理员权限信息
 * @property {ObjectId} _id - 管理员记录唯一标识符
 * @property {ObjectId} userId - 关联的用户ID，引用UserSchema._id
 * @property {number} priority - 管理员权限级别 (0: 超级管理员, 1: 普通管理员)
 * @property {Date} createdAt - 管理员权限创建时间
 * @property {Date} updatedAt - 管理员权限最后更新时间
 */
export interface AdminSchema {
    _id: ObjectId;
    userId: ObjectId;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}