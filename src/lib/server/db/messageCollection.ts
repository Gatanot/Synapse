/**
 * @fileoverview 消息集合操作模块
 * @description 提供用户消息的增删改查操作，包括消息状态管理、分页查询等功能
 * @author Synapse Team
 * @since 2025-01-01
 */

import { getCollection } from './db';
import type { MessageSchema } from '$lib/schema/messageSchema';
import type { ObjectId, OptionalId } from 'mongodb';

/**
 * 新增一条消息
 * @description 向消息集合中插入一条新消息，系统通知用户或管理员操作时使用
 * @param {OptionalId<MessageSchema>} message - 消息对象（_id 可选）
 * @returns {Promise<ObjectId>} 插入的消息ID
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function insertMessage(message: OptionalId<MessageSchema>) {
  const collection = await getCollection<OptionalId<MessageSchema>>('messages');
  const result = await collection.insertOne(message);
  return result.insertedId;
}

/**
 * 查询某个用户的所有消息（支持分页）
 * @description 按创建时间倒序获取用户消息，支持分页以优化性能
 * @param {ObjectId} userId - 用户ID
 * @param {number} [page=1] - 页码，从1开始
 * @param {number} [pageSize=20] - 每页消息数量
 * @returns {Promise<MessageSchema[]>} 消息列表
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function getMessagesByUserId(
  userId: ObjectId,
  page = 1,
  pageSize = 20
) {
  const collection = await getCollection<MessageSchema>('messages');
  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
}

/**
 * 标记消息为已读
 * @description 用户查看消息后更新消息状态，避免重复提醒
 * @param {ObjectId} messageId - 消息ID
 * @returns {Promise<void>}
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function markMessageAsRead(messageId: ObjectId) {
  const collection = await getCollection<MessageSchema>('messages');
  await collection.updateOne({ _id: messageId }, { $set: { isRead: true } });
}

/**
 * 批量标记用户所有消息为已读
 * @description 用户一键标记所有未读消息为已读状态，提升用户体验
 * @param {ObjectId} userId - 用户ID
 * @returns {Promise<void>}
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function markAllMessagesAsRead(userId: ObjectId) {
  const collection = await getCollection<MessageSchema>('messages');
  await collection.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
}

/**
 * 删除指定用户所有已读消息
 * @description 清理用户已读消息以节省存储空间，保持系统性能
 * @param {ObjectId} userId - 用户ID
 * @returns {Promise<void>}
 * @throws {Error} 当数据库操作失败时抛出错误
 */
export async function deleteAllReadMessages(userId: ObjectId) {
  const collection = await getCollection<MessageSchema>('messages');
  await collection.deleteMany({ userId, isRead: true });
}

