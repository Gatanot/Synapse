/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/messageCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection, ObjectId } from '$lib/server/db/db';
import * as messageDb from '$lib/server/db/messageCollection';
import type { MessageSchema } from '$lib/schema/messageSchema';

const TEST_USER_ID = new ObjectId();
const TEST_FROM_USER_ID = new ObjectId();
const TEST_ARTICLE_ID = new ObjectId();
const TEST_COMMENT_ID = new ObjectId();

beforeEach(async () => {
  const col = await getCollection('messages');
  await col.deleteMany({});
});

afterEach(async () => {
  const col = await getCollection('messages');
  await col.deleteMany({});
});

describe('messageCollection 消息数据库操作', () => {
  it('应能成功插入评论消息', async () => {
    const message: Omit<MessageSchema, '_id'> = {
      userId: TEST_USER_ID,
      type: 'comment',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '测试文章',
      commentId: TEST_COMMENT_ID,
      commentContent: '这是一条测试评论',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '评论者',
      createdAt: new Date(),
      isRead: false
    };

    const insertedId = await messageDb.insertMessage(message);
    expect(insertedId).toBeDefined();
    expect(ObjectId.isValid(insertedId)).toBe(true);

    // 验证消息已保存
    const collection = await getCollection('messages');
    const savedMessage = await collection.findOne({ _id: insertedId });
    expect(savedMessage).toBeDefined();
    expect(savedMessage?.type).toBe('comment');
    expect(savedMessage?.isRead).toBe(false);
  });

  it('应能成功插入点赞消息', async () => {
    const message: Omit<MessageSchema, '_id'> = {
      userId: TEST_USER_ID,
      type: 'like',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '测试文章',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '点赞者',
      createdAt: new Date(),
      isRead: false
    };

    const insertedId = await messageDb.insertMessage(message);
    expect(insertedId).toBeDefined();

    // 验证消息已保存
    const collection = await getCollection('messages');
    const savedMessage = await collection.findOne({ _id: insertedId });
    expect(savedMessage?.type).toBe('like');
    expect(savedMessage?.commentId).toBeUndefined();
    expect(savedMessage?.commentContent).toBeUndefined();
  });

  it('应能根据用户ID获取消息列表', async () => {
    // 插入多条消息
    const messages = [
      {
        userId: TEST_USER_ID,
        type: 'comment' as const,
        articleId: TEST_ARTICLE_ID,
        articleTitle: '文章1',
        fromUserId: TEST_FROM_USER_ID,
        fromUserName: '用户1',
        createdAt: new Date(Date.now() - 1000),
        isRead: false
      },
      {
        userId: TEST_USER_ID,
        type: 'like' as const,
        articleId: TEST_ARTICLE_ID,
        articleTitle: '文章2',
        fromUserId: TEST_FROM_USER_ID,
        fromUserName: '用户2',
        createdAt: new Date(),
        isRead: false
      }
    ];

    for (const message of messages) {
      await messageDb.insertMessage(message);
    }

    const result = await messageDb.getMessagesByUserId(TEST_USER_ID, 1, 10);
    expect(result).toHaveLength(2);
    // 应该按创建时间倒序排列
    expect(result[0].articleTitle).toBe('文章2');
    expect(result[1].articleTitle).toBe('文章1');
  });

  it('应能正确分页获取消息', async () => {
    // 插入3条消息
    for (let i = 0; i < 3; i++) {
      await messageDb.insertMessage({
        userId: TEST_USER_ID,
        type: 'like',
        articleId: TEST_ARTICLE_ID,
        articleTitle: `文章${i}`,
        fromUserId: TEST_FROM_USER_ID,
        fromUserName: `用户${i}`,
        createdAt: new Date(Date.now() + i * 1000),
        isRead: false
      });
    }

    // 获取第1页，每页2条
    const page1 = await messageDb.getMessagesByUserId(TEST_USER_ID, 1, 2);
    expect(page1).toHaveLength(2);

    // 获取第2页，每页2条
    const page2 = await messageDb.getMessagesByUserId(TEST_USER_ID, 2, 2);
    expect(page2).toHaveLength(1);
  });

  it('应能标记单条消息为已读', async () => {
    const messageId = await messageDb.insertMessage({
      userId: TEST_USER_ID,
      type: 'comment',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '测试文章',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '测试用户',
      createdAt: new Date(),
      isRead: false
    });

    await messageDb.markMessageAsRead(messageId);

    const collection = await getCollection('messages');
    const message = await collection.findOne({ _id: messageId });
    expect(message?.isRead).toBe(true);
  });

  it('应能批量标记用户所有消息为已读', async () => {
    // 插入多条未读消息
    for (let i = 0; i < 3; i++) {
      await messageDb.insertMessage({
        userId: TEST_USER_ID,
        type: 'like',
        articleId: TEST_ARTICLE_ID,
        articleTitle: `文章${i}`,
        fromUserId: TEST_FROM_USER_ID,
        fromUserName: `用户${i}`,
        createdAt: new Date(),
        isRead: false
      });
    }

    await messageDb.markAllMessagesAsRead(TEST_USER_ID);

    const collection = await getCollection('messages');
    const messages = await collection.find({ userId: TEST_USER_ID }).toArray();
    
    expect(messages).toHaveLength(3);
    messages.forEach(message => {
      expect(message.isRead).toBe(true);
    });
  });

  it('应能删除用户所有已读消息', async () => {
    // 插入已读和未读消息
    await messageDb.insertMessage({
      userId: TEST_USER_ID,
      type: 'like',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '已读消息',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '用户1',
      createdAt: new Date(),
      isRead: true
    });

    await messageDb.insertMessage({
      userId: TEST_USER_ID,
      type: 'comment',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '未读消息',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '用户2',
      createdAt: new Date(),
      isRead: false
    });

    await messageDb.deleteAllReadMessages(TEST_USER_ID);

    const collection = await getCollection('messages');
    const remainingMessages = await collection.find({ userId: TEST_USER_ID }).toArray();
    
    expect(remainingMessages).toHaveLength(1);
    expect(remainingMessages[0].articleTitle).toBe('未读消息');
    expect(remainingMessages[0].isRead).toBe(false);
  });

  it('不应获取到其他用户的消息', async () => {
    const otherUserId = new ObjectId();

    await messageDb.insertMessage({
      userId: otherUserId,
      type: 'like',
      articleId: TEST_ARTICLE_ID,
      articleTitle: '其他用户的消息',
      fromUserId: TEST_FROM_USER_ID,
      fromUserName: '用户',
      createdAt: new Date(),
      isRead: false
    });

    const messages = await messageDb.getMessagesByUserId(TEST_USER_ID);
    expect(messages).toHaveLength(0);
  });
});
