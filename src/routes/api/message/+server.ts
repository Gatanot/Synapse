import { json, error } from '@sveltejs/kit';
import { getMessagesByUserId, insertMessage, markMessageAsRead, markAllMessagesAsRead, deleteAllReadMessages } from '$lib/server/db/messageCollection';
import type { RequestHandler } from './$types';
import type { MessageCreateForm } from '$lib/types/share/messageShare';
import { ObjectId } from '$lib/server/db/db';

// 获取当前用户ID的工具函数（需根据你的项目实际实现）
function getUserIdFromLocals(locals: App.Locals): ObjectId {
  if (!locals.user?._id) throw error(401, '未登录');
  return new ObjectId(locals.user._id);
}

// 获取消息列表
export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = getUserIdFromLocals(locals);
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
  const messages = await getMessagesByUserId(userId, page, pageSize);

  // 转换为前端类型
  const result = messages.map(msg => ({
    ...msg,
    _id: msg._id.toString(),
    userId: msg.userId.toString(),
    articleId: msg.articleId.toString(),
    commentId: msg.commentId?.toString(),
    fromUserId: msg.fromUserId.toString(),
    createdAt: msg.createdAt.toISOString()
  }));

  return json({ code: 0, data: result });
};

// 创建新消息
export const POST: RequestHandler = async ({ request }) => {
  const form: MessageCreateForm = await request.json();
  const now = new Date();
  const message = {
    ...form,
    userId: new ObjectId(form.userId),
    articleId: new ObjectId(form.articleId),
    commentId: form.commentId ? new ObjectId(form.commentId) : undefined,
    fromUserId: new ObjectId(form.fromUserId),
    createdAt: now,
    isRead: false
  };
  await insertMessage(message);
  return json({ code: 0, msg: 'ok' });
};

// 标记单条消息为已读
export const PATCH: RequestHandler = async ({ request }) => {
  const { messageId } = await request.json();
  if (!messageId) throw error(400, '缺少 messageId');
  await markMessageAsRead(new ObjectId(messageId));
  return json({ code: 0, msg: 'ok' });
};

// 批量标记为已读
export const PUT: RequestHandler = async ({ locals }) => {
  const userId = getUserIdFromLocals(locals);
  await markAllMessagesAsRead(userId);
  return json({ code: 0, msg: 'ok' });
};

// 删除所有已读消息
export const DELETE: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    throw error(401, '未登录');
  }
  const userId = new ObjectId(locals.user._id);
  await deleteAllReadMessages(userId);
  return json({ code: 0, msg: '已读消息已全部删除' });
};
