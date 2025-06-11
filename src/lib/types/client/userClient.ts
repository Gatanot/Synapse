import { ObjectId } from 'mongodb';

/**
 *   代表 'users' 集合中的文档结构。
 * 这是最原始的数据类型，直接与数据库交互时使用。
 */
export interface UserClient {
    _id: string;
    name: string;
    email: string;
    articles: string[]; // Explicitly define as an array of ObjectId
}