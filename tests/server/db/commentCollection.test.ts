/**
 * @vitest-environment node
 * @file 针对 src/lib/server/db/commentCollection.ts 的单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCollection, ObjectId } from '$lib/server/db/db';
import * as userDb from '$lib/server/db/userCollection';
import * as articleDb from '$lib/server/db/articleCollection';
import * as commentDb from '$lib/server/db/commentCollection';

const TEST_USER = {
  name: '评论用户',
  email: 'commenter@example.com',
  password: 'password'
};

let testUserId: string;
let testArticleId: string;

beforeEach(async () => {
  // 清空相关集合
  await (await getCollection('comments')).deleteMany({});
  await (await getCollection('articles')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
  
  // 确保索引
  await userDb.ensureUserIndexes();
  await articleDb.ensureArticleIndexes();
  await commentDb.ensureCommentIndexes();
  
  // 创建测试用户
  const userRes = await userDb.createUser(TEST_USER);
  testUserId = userRes.data!.insertedId.toString();
  
  // 创建测试文章
  const articleRes = await articleDb.createArticle({
    title: '测试文章',
    summary: '测试文章摘要',
    tags: ['测试'],
    authorId: testUserId,
    authorName: TEST_USER.name,
    body: '测试文章内容',
    status: 'published'
  });
  testArticleId = articleRes.data!.insertedId.toString();
});

afterEach(async () => {
  await (await getCollection('comments')).deleteMany({});
  await (await getCollection('articles')).deleteMany({});
  await (await getCollection('users')).deleteMany({});
});

describe('commentCollection 评论数据库操作', () => {
  it('应能成功创建评论', async () => {
    const commentData = {
      content: '这是一条测试评论',
      articleId: testArticleId,
      authorId: testUserId,
      authorName: TEST_USER.name
    };

    const result = await commentDb.createComment(commentData);
    
    expect(result.error).toBeNull();
    expect(result.data?.insertedId).toBeDefined();
    
    // 验证评论已保存
    const collection = await getCollection('comments');
    const savedComment = await collection.findOne({ _id: result.data!.insertedId });
    expect(savedComment?.content).toBe(commentData.content);
    expect(savedComment?.authorName).toBe(commentData.authorName);
  });

  it('创建评论时应更新文章的评论数组', async () => {
    const commentData = {
      content: '测试评论',
      articleId: testArticleId,
      authorId: testUserId,
      authorName: TEST_USER.name
    };

    const result = await commentDb.createComment(commentData);
    expect(result.error).toBeNull();
    
    // 检查文章的评论数组
    const article = await articleDb.getArticleById(testArticleId);
    expect(article.data?.comments).toHaveLength(1);
    expect(article.data?.comments[0].toString()).toBe(result.data!.insertedId.toString());
  });

  it('应能根据文章ID获取评论列表', async () => {
    // 创建多条评论
    const comments = [
      { content: '第一条评论', articleId: testArticleId, authorId: testUserId, authorName: TEST_USER.name },
      { content: '第二条评论', articleId: testArticleId, authorId: testUserId, authorName: TEST_USER.name },
      { content: '第三条评论', articleId: testArticleId, authorId: testUserId, authorName: TEST_USER.name }
    ];

    for (const comment of comments) {
      await commentDb.createComment(comment);
    }

    const result = await commentDb.getCommentsByArticleId(testArticleId);
    
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3);
    
    // 应该按创建时间倒序排列
    expect(result.data?.[0].content).toBe('第三条评论');
    expect(result.data?.[2].content).toBe('第一条评论');
  });

  it('应能正确分页获取评论', async () => {
    // 创建5条评论
    for (let i = 1; i <= 5; i++) {
      await commentDb.createComment({
        content: `评论${i}`,
        articleId: testArticleId,
        authorId: testUserId,
        authorName: TEST_USER.name
      });
    }

    // 获取前3条
    const result = await commentDb.getCommentsByArticleId(testArticleId, { limit: 3, skip: 0 });
    expect(result.data).toHaveLength(3);
    
    // 获取后2条
    const result2 = await commentDb.getCommentsByArticleId(testArticleId, { limit: 3, skip: 3 });
    expect(result2.data).toHaveLength(2);
  });

  it('应能处理无效的文章ID', async () => {
    const result = await commentDb.getCommentsByArticleId('invalid-id');
    
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INVALID_ID_FORMAT');
  });

  it('应能获取指定时间后的评论', async () => {
    const startTime = new Date(Date.now() - 1000);
    
    // 创建一条评论
    await commentDb.createComment({
      content: '新评论',
      articleId: testArticleId,
      authorId: testUserId,
      authorName: TEST_USER.name
    });

    const result = await commentDb.getCommentsAfter(startTime);
    
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].content).toBe('新评论');
  });

  it('应能搜索评论内容', async () => {
    // 创建不同内容的评论
    const comments = [
      { content: '这是关于JavaScript的评论', articleId: testArticleId, authorId: testUserId, authorName: 'JS用户' },
      { content: '这是关于Python的评论', articleId: testArticleId, authorId: testUserId, authorName: 'Python用户' },
      { content: '这是关于编程的评论', articleId: testArticleId, authorId: testUserId, authorName: '编程用户' }
    ];

    for (const comment of comments) {
      await commentDb.createComment(comment);
    }

    // 搜索内容
    const result1 = await commentDb.searchComments('JavaScript');
    expect(result1.data).toHaveLength(1);
    expect(result1.data?.[0].content).toContain('JavaScript');

    // 搜索作者名
    const result2 = await commentDb.searchComments('Python用户');
    expect(result2.data).toHaveLength(1);
    expect(result2.data?.[0].authorName).toBe('Python用户');

    // 模糊搜索
    const result3 = await commentDb.searchComments('编程');
    expect(result3.data?.length).toBeGreaterThan(0);
  });

  it('应能删除评论并更新文章的评论数组', async () => {
    // 创建评论
    const commentResult = await commentDb.createComment({
      content: '待删除的评论',
      articleId: testArticleId,
      authorId: testUserId,
      authorName: TEST_USER.name
    });
    
    const commentId = commentResult.data!.insertedId.toString();
    
    // 验证文章有评论
    let article = await articleDb.getArticleById(testArticleId);
    expect(article.data?.comments).toHaveLength(1);
    
    // 删除评论
    const deleteResult = await commentDb.deleteCommentById(commentId);
    expect(deleteResult.error).toBeNull();
    
    // 验证评论已删除
    const commentCollection = await getCollection('comments');
    const deletedComment = await commentCollection.findOne({ _id: new ObjectId(commentId) });
    expect(deletedComment).toBeNull();
    
    // 验证文章的评论数组已更新
    article = await articleDb.getArticleById(testArticleId);
    expect(article.data?.comments).toHaveLength(0);
  });

  it('删除不存在的评论应返回错误', async () => {
    const fakeCommentId = new ObjectId().toString();
    
    const result = await commentDb.deleteCommentById(fakeCommentId);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('应能处理无效的评论ID格式', async () => {
    const result = await commentDb.deleteCommentById('invalid-id');
    
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INVALID_ID_FORMAT');
  });

  it('空搜索词应返回空结果', async () => {
    const result = await commentDb.searchComments('');
    
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it('评论应包含正确的时间戳', async () => {
    const beforeCreate = new Date();
    
    const result = await commentDb.createComment({
      content: '时间测试评论',
      articleId: testArticleId,
      authorId: testUserId,
      authorName: TEST_USER.name
    });
    
    const afterCreate = new Date();
    
    const comments = await commentDb.getCommentsByArticleId(testArticleId);
    const comment = comments.data?.[0];
    
    expect(comment?.createdAt).toBeInstanceOf(Date);
    expect(comment?.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(comment?.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
