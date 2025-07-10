/**
 * @fileoverview 数据库操作通用类型定义
 * @description 定义数据库操作的通用接口和错误处理类型
 * @author Synapse Team
 * @since 2025-01-01
 */

/**
 * 数据库错误对象接口
 * @interface DbError
 * @property {string} code - 错误码，用于程序化判断错误类型
 * @property {string} message - 错误描述信息，用于日志记录和调试
 */
export interface DbError {
    code: string;
    message: string;
}

/**
 * 数据库操作结果封装接口
 * @interface DbResult
 * @template T - 成功时返回数据的类型
 * @property {T | null} data - 操作成功时的返回数据，失败时为null
 * @property {DbError | null} error - 操作失败时的错误信息，成功时为null
 */
export interface DbResult<T> {
    data: T | null;
    error: DbError | null;
}

