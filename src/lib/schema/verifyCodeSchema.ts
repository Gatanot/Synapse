// src/lib/schema/verifyCodeSchema.ts
import type { ObjectId } from 'mongodb';

/**
 * 代表 register_codes 集合中的文档结构。
 */
export interface RegisterCodeSchema {
    _id?: ObjectId;
    email: string;
    code: string;
    expiresAt: Date;
}
