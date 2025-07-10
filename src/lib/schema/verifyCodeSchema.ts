/**
 * @fileoverview 注册验证码数据模式定义
 * @description 定义注册验证码集合的数据结构和字段规范
 * @author Synapse Team
 * @since 2025-01-01
 */

import type { ObjectId } from 'mongodb';

/**
 * 注册验证码数据模式接口
 * @interface RegisterCodeSchema
 * @description 定义register_codes集合中文档的完整结构，用于存储用户注册时的邮箱验证码
 * @property {ObjectId} [_id] - 验证码记录唯一标识符，可选字段
 * @property {string} email - 验证码发送的目标邮箱地址
 * @property {string} code - 6位数字验证码
 * @property {Date} expiresAt - 验证码过期时间，用于TTL索引自动清理过期验证码
 */
export interface RegisterCodeSchema {
    _id?: ObjectId;
    email: string;
    code: string;
    expiresAt: Date;
}
