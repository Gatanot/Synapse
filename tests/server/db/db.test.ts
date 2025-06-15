// tests/server/db/db.test.ts (新的、更简单的测试)

/**
 * @vitest-environment node
 * @file 本文件为 `src/lib/server/db.ts` 提供 Vitest 测试。
 * 注意：由于重构，此文件只测试 db.ts 的核心连接和获取功能。
 * 索引相关的测试已移至 database.test.ts。
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { MongoClient, Db } from 'mongodb';

// 只需要 mock 环境变量
vi.mock('$env/static/private', () => ({
    MONGODB_URL: process.env.MONGODB_URL,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
}));

describe('数据库核心连接 (db.ts)', () => {

    beforeEach(() => {
        vi.resetModules(); // 确保单例被重置
    });

    afterAll(async () => {
        const { getClient } = await import('$lib/server/db');
        await getClient().close();
    });

    it('connectToDatabase 应成功连接并返回 Db 实例', async () => {
        const { connectToDatabase } = await import('$lib/server/db');
        const db = await connectToDatabase();
        expect(db).toBeInstanceOf(Db);
    });

    it('connectToDatabase 应实现单例模式', async () => {
        const { connectToDatabase } = await import('$lib/server/db');
        const db1 = await connectToDatabase();
        const db2 = await connectToDatabase();
        expect(db1).toBe(db2);
    });
    
    it('getClient 应返回 MongoClient 实例', async () => {
        const { getClient } = await import('$lib/server/db');
        expect(getClient()).toBeInstanceOf(MongoClient);
    });

    it('getCollection 应能获取一个集合', async () => {
        const { getCollection } = await import('$lib/server/db');
        const collection = await getCollection('test_collection');
        expect(collection).toBeDefined();
        expect(collection.collectionName).toBe('test_collection');
    });
});