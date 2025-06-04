import { connectToDatabase, ensureIndexes } from '$lib/server/db/db';
(async () => {
    try {
        console.log('Server starting: Initializing database connection and ensuring indexes...');
        // 1. 首先确保数据库连接成功
        await connectToDatabase();
        // 2. 然后检查/创建索引
        await ensureIndexes();
        console.log('Database connection successful and indexes ensured.');
    } catch (error) {
        console.error('CRITICAL: Failed to initialize database or ensure indexes during server startup.', error);
        process.exit(1);
    }
})();
