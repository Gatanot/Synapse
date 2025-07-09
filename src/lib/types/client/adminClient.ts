/**
 * 客户端管理员类型
 * 用于在前端显示管理员信息，所有ObjectId字段都转换为字符串
 */
export interface AdminClient {
    _id: string;
    userId: string; // 对应用户ID，字符串格式
    priority: number; // 管理员分类；1:普通管理员，0:超级管理员
    createdAt: Date;
    updatedAt: Date;
}