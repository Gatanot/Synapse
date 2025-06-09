/**
 * @description 代表数据库操作中结构化的错误对象。
 * code: 用于程序化判断的错误码。
 * message: 用于日志记录或调试的描述性信息。
 */
export interface DbError {
    code: string;
    message: string;
}

/**
 * @description 一个通用的数据库操作返回结果的封装。
 * T: 成功时 data 字段的类型。
 */
export interface DbResult<T> {
    data: T | null;
    error: DbError | null;
}