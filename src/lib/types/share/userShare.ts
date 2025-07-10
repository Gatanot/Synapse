/**
 * @fileoverview 用户共享类型定义
 * @description 定义前后端共享的用户数据传输对象，用于API交互
 * @author Synapse Team
 * @since 2025-01-01
 */

/**
 * 用户注册数据传输对象
 * @description 客户端注册表单提交的数据结构，不包含服务器生成字段
 */
export interface UserRegisterShare {
    /** 用户姓名 */
    name: string;
    /** 邮箱地址，用作登录凭证 */
    email: string;
    /** 用户密码 */
    password: string;
}

/**
 * 用户登录数据传输对象
 * @description 客户端登录表单提交的数据结构
 */
export interface UserLoginShare {
    /** 邮箱地址 */
    email: string;
    /** 用户密码 */
    password: string;
}