import { getCollection } from './db';
import type { MessageSchema } from '$lib/schema/messageSchema';
import type { ObjectId, OptionalId } from 'mongodb';

/**
 * 新增一条消息
 */
export async function insertMessage(message: OptionalId<MessageSchema>) {
  const collection = await getCollection<OptionalId<MessageSchema>>('messages');
  const result = await collection.insertOne(message);
  return result.insertedId;
}

/**
 * 查询某个用户的所有消息（可分页）
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
 */
export async function markMessageAsRead(messageId: ObjectId) {
  const collection = await getCollection<MessageSchema>('messages');
  await collection.updateOne({ _id: messageId }, { $set: { isRead: true } });
}

/**
 * 批量标记用户所有消息为已读
 */
export async function markAllMessagesAsRead(userId: ObjectId) {
  const collection = await getCollection<MessageSchema>('messages');
  await collection.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
}
