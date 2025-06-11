/**
 *   用于创建新用户的数据传输对象 (DTO)。
 * 它定义了从客户端注册表单发送到服务器的数据结构。
 * 不包含任何服务器端生成的字段。
 */
export interface UserRegisterShare {
    name: string;
    email: string;
    password: string;
}
export interface UserLoginShare {
    email: string;
    password: string;
}