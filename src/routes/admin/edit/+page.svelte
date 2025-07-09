<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { goto } from '$app/navigation';
    import type { ActionData, PageData } from './$types';
    import type { AdminClient, UserClient } from '$lib/types/client';

    interface AdminWithUser {
        admin: AdminClient;
        user: UserClient | null;
    }

    let { data, form } = $props<{ 
        data: PageData & { 
            admin: AdminClient; 
            adminWithUsers: AdminWithUser[]; 
        };
        form: ActionData;
    }>();

    let showAddForm = $state(false);
    let identifier = $state('');
    let isSubmitting = $state(false);
    let deleteConfirmId = $state<string | null>(null);

    function toggleAddForm() {
        showAddForm = !showAddForm;
        if (!showAddForm) {
            identifier = '';
        }
    }

    function formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('zh-CN');
    }

    function confirmDelete(adminId: string) {
        deleteConfirmId = adminId;
    }

    function cancelDelete() {
        deleteConfirmId = null;
    }

    function goBack() {
        goto('/admin');
    }

    function handleKeydown(event: KeyboardEvent, action: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    }
</script>

<svelte:head>
    <title>管理员编辑 - Synapse</title>
    <meta name="description" content="管理员编辑页面，仅限超级管理员访问" />
</svelte:head>

<main class="admin-edit-main">
    <div class="admin-edit-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-content">
                <button class="back-button" onclick={goBack} type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    返回管理后台
                </button>
                <h1>管理员编辑</h1>
                <div class="admin-badge super-admin">
                    超级管理员
                </div>
            </div>
        </div>

        <!-- 消息提示 -->
        {#if form?.error}
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {form.error}
            </div>
        {/if}

        {#if form?.success}
            <div class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {form.message}
            </div>
        {/if}

        <!-- 添加管理员区域 -->
        <div class="add-admin-section">
            <div class="section-header">
                <h2>添加普通管理员</h2>
                <button class="add-button" onclick={toggleAddForm} type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    {showAddForm ? '取消' : '添加管理员'}
                </button>
            </div>

            {#if showAddForm}
                <div class="add-form-container">
                    <form method="POST" action="?/addAdmin" use:enhance={() => {
                        isSubmitting = true;
                        return async ({ update }) => {
                            isSubmitting = false;
                            await update();
                            if (form?.success) {
                                identifier = '';
                                showAddForm = false;
                                await invalidateAll();
                            }
                        };
                    }}>
                        <div class="form-group">
                            <label for="identifier">用户邮箱或ID</label>
                            <input 
                                id="identifier"
                                name="identifier" 
                                type="text" 
                                bind:value={identifier}
                                placeholder="请输入用户邮箱或用户ID"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="submit-button" disabled={isSubmitting}>
                                {isSubmitting ? '添加中...' : '添加管理员'}
                            </button>
                            <button type="button" class="cancel-button" onclick={toggleAddForm}>
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            {/if}
        </div>

        <!-- 管理员列表 -->
        <div class="admin-list-section">
            <div class="section-header">
                <h2>普通管理员列表</h2>
                <div class="admin-count">
                    共 {data.adminWithUsers.length} 名普通管理员
                </div>
            </div>

            {#if data.adminWithUsers.length === 0}
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <h3>暂无普通管理员</h3>
                    <p>点击上方的"添加管理员"按钮来添加第一个普通管理员</p>
                </div>
            {:else}
                <div class="admin-grid">
                    {#each data.adminWithUsers as { admin, user }}
                        <div class="admin-card">
                            <div class="admin-info">
                                <div class="admin-avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <div class="admin-details">
                                    <h3>{user?.name || '未知用户'}</h3>
                                    <p class="admin-email">{user?.email || '邮箱不可用'}</p>
                                    <p class="admin-signature">{user?.signature || '暂无签名'}</p>
                                    <div class="admin-meta">
                                        <span>创建时间: {formatDate(admin.createdAt)}</span>
                                        <span>用户ID: {admin.userId}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="admin-actions">
                                <button 
                                    class="delete-button"
                                    onclick={() => confirmDelete(admin.userId)}
                                    type="button"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                    删除
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</main>

<!-- 删除确认弹窗 -->
{#if deleteConfirmId}
    <div class="modal-overlay" onclick={cancelDelete}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h3>确认删除</h3>
            </div>
            <div class="modal-body">
                <p>确定要删除这个管理员吗？此操作不可撤销。</p>
            </div>
            <div class="modal-actions">
                <form method="POST" action="?/deleteAdmin" use:enhance={() => {
                    return async ({ update }) => {
                        await update();
                        deleteConfirmId = null;
                        if (form?.success) {
                            await invalidateAll();
                        }
                    };
                }}>
                    <input type="hidden" name="adminId" value={deleteConfirmId} />
                    <button type="submit" class="confirm-delete-button">
                        确认删除
                    </button>
                </form>
                <button type="button" class="cancel-button" onclick={cancelDelete}>
                    取消
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* 全局变量 */
    :root {
        --admin-bg-primary: #fafafa;
        --admin-bg-secondary: #ffffff;
        --admin-bg-tertiary: #f5f5f5;
        --admin-text-primary: #212121;
        --admin-text-secondary: #757575;
        --admin-text-tertiary: #9e9e9e;
        --admin-border-color: #e0e0e0;
        --admin-border-hover: #bdbdbd;
        --admin-shadow-light: 0 2px 4px rgba(0, 0, 0, 0.1);
        --admin-shadow-medium: 0 4px 8px rgba(0, 0, 0, 0.12);
        --admin-shadow-heavy: 0 8px 16px rgba(0, 0, 0, 0.15);
        --admin-accent-color: #424242;
        --admin-accent-hover: #616161;
        --admin-danger-color: #f44336;
        --admin-danger-hover: #d32f2f;
        --admin-success-color: #4caf50;
        --admin-success-hover: #388e3c;
        --admin-warning-color: #ff9800;
        --admin-warning-hover: #f57c00;
        --admin-radius-sm: 4px;
        --admin-radius-md: 8px;
        --admin-radius-lg: 12px;
        --admin-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* 主体布局 */
    .admin-edit-main {
        min-height: 100vh;
        background: var(--admin-bg-primary);
        padding: 24px 0;
    }

    .admin-edit-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
    }

    /* 页面头部 */
    .page-header {
        margin-bottom: 32px;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
        background: var(--admin-bg-secondary);
        border-radius: var(--admin-radius-lg);
        box-shadow: var(--admin-shadow-light);
        border: 1px solid var(--admin-border-color);
    }

    .back-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--admin-bg-tertiary);
        border: 1px solid var(--admin-border-color);
        color: var(--admin-text-primary);
        padding: 8px 16px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        transition: var(--admin-transition);
        font-size: 14px;
        font-weight: 500;
    }

    .back-button:hover {
        background: var(--admin-accent-color);
        color: white;
        border-color: var(--admin-accent-color);
    }

    .back-button svg {
        width: 16px;
        height: 16px;
    }

    .header-content h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: var(--admin-text-primary);
        flex-grow: 1;
        letter-spacing: -0.5px;
    }

    .admin-badge {
        padding: 8px 16px;
        border-radius: var(--admin-radius-sm);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: var(--admin-accent-color);
        color: white;
        border: 1px solid var(--admin-accent-color);
    }

    /* 消息提示 */
    .alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: var(--admin-radius-md);
        margin-bottom: 24px;
        font-weight: 500;
        font-size: 14px;
        box-shadow: var(--admin-shadow-light);
    }

    .alert svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .alert-error {
        background: #ffebee;
        border: 1px solid #ffcdd2;
        color: var(--admin-danger-color);
    }

    .alert-success {
        background: #e8f5e8;
        border: 1px solid #c8e6c9;
        color: var(--admin-success-color);
    }

    /* 卡片区域 */
    .add-admin-section,
    .admin-list-section {
        background: var(--admin-bg-secondary);
        border-radius: var(--admin-radius-lg);
        box-shadow: var(--admin-shadow-light);
        border: 1px solid var(--admin-border-color);
        margin-bottom: 24px;
        overflow: hidden;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid var(--admin-border-color);
        background: var(--admin-bg-tertiary);
    }

    .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--admin-text-primary);
        letter-spacing: -0.25px;
    }

    .admin-count {
        font-size: 14px;
        color: var(--admin-text-secondary);
        background: var(--admin-bg-secondary);
        padding: 4px 12px;
        border-radius: var(--admin-radius-sm);
        border: 1px solid var(--admin-border-color);
    }

    /* 按钮样式 */
    .add-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--admin-accent-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--admin-transition);
        box-shadow: var(--admin-shadow-light);
    }

    .add-button:hover {
        background: var(--admin-accent-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    .add-button svg {
        width: 16px;
        height: 16px;
    }

    /* 表单样式 */
    .add-form-container {
        padding: 24px;
        background: var(--admin-bg-primary);
        border-top: 1px solid var(--admin-border-color);
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--admin-text-primary);
        font-size: 14px;
    }

    .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-sm);
        font-size: 14px;
        transition: var(--admin-transition);
        background: var(--admin-bg-secondary);
        color: var(--admin-text-primary);
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--admin-accent-color);
        box-shadow: 0 0 0 2px rgba(66, 66, 66, 0.1);
    }

    .form-group input::placeholder {
        color: var(--admin-text-tertiary);
    }

    .form-actions {
        display: flex;
        gap: 12px;
    }

    .submit-button {
        background: var(--admin-accent-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--admin-transition);
        box-shadow: var(--admin-shadow-light);
    }

    .submit-button:hover:not(:disabled) {
        background: var(--admin-accent-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    .submit-button:disabled {
        background: var(--admin-text-tertiary);
        cursor: not-allowed;
        box-shadow: none;
    }

    .cancel-button {
        background: var(--admin-bg-secondary);
        color: var(--admin-text-secondary);
        border: 1px solid var(--admin-border-color);
        padding: 12px 24px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--admin-transition);
    }

    .cancel-button:hover {
        background: var(--admin-bg-tertiary);
        color: var(--admin-text-primary);
        border-color: var(--admin-border-hover);
    }

    /* 管理员网格 */
    .admin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        gap: 16px;
        padding: 24px;
    }

    .admin-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-md);
        background: var(--admin-bg-secondary);
        transition: var(--admin-transition);
    }

    .admin-card:hover {
        box-shadow: var(--admin-shadow-medium);
        border-color: var(--admin-border-hover);
    }

    .admin-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-grow: 1;
    }

    .admin-avatar {
        width: 48px;
        height: 48px;
        background: var(--admin-accent-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
        box-shadow: var(--admin-shadow-light);
    }

    .admin-avatar svg {
        width: 24px;
        height: 24px;
    }

    .admin-details h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--admin-text-primary);
        line-height: 1.2;
    }

    .admin-email {
        margin: 0 0 4px 0;
        color: var(--admin-text-secondary);
        font-size: 14px;
        line-height: 1.3;
    }

    .admin-signature {
        margin: 0 0 8px 0;
        color: var(--admin-text-tertiary);
        font-size: 13px;
        font-style: italic;
        line-height: 1.3;
    }

    .admin-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 12px;
        color: var(--admin-text-tertiary);
        line-height: 1.2;
    }

    /* 删除按钮 */
    .delete-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--admin-danger-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: var(--admin-transition);
        box-shadow: var(--admin-shadow-light);
    }

    .delete-button:hover {
        background: var(--admin-danger-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    .delete-button svg {
        width: 14px;
        height: 14px;
    }

    /* 空状态 */
    .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--admin-text-secondary);
    }

    .empty-state svg {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
        color: var(--admin-text-tertiary);
    }

    .empty-state h3 {
        margin: 0 0 8px 0;
        color: var(--admin-text-primary);
        font-size: 18px;
        font-weight: 600;
    }

    .empty-state p {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
    }

    /* 弹窗样式 */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background: var(--admin-bg-secondary);
        border-radius: var(--admin-radius-lg);
        box-shadow: var(--admin-shadow-heavy);
        max-width: 420px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid var(--admin-border-color);
    }

    .modal-header {
        padding: 24px;
        border-bottom: 1px solid var(--admin-border-color);
        background: var(--admin-bg-tertiary);
    }

    .modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--admin-text-primary);
    }

    .modal-body {
        padding: 24px;
        color: var(--admin-text-secondary);
    }

    .modal-body p {
        margin: 0;
        line-height: 1.6;
        font-size: 14px;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        padding: 24px;
        border-top: 1px solid var(--admin-border-color);
        background: var(--admin-bg-tertiary);
    }

    .confirm-delete-button {
        background: var(--admin-danger-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--admin-transition);
        box-shadow: var(--admin-shadow-light);
    }

    .confirm-delete-button:hover {
        background: var(--admin-danger-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
        .admin-edit-container {
            padding: 0 16px;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
        }

        .header-content h1 {
            font-size: 24px;
        }

        .admin-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
        }

        .admin-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 16px;
        }

        .admin-info {
            width: 100%;
        }

        .admin-actions {
            width: 100%;
            text-align: right;
        }

        .form-actions {
            flex-direction: column;
        }

        .modal-actions {
            flex-direction: column;
        }

        .modal-content {
            width: 95%;
            margin: 16px;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
    }

    @media (max-width: 480px) {
        .admin-edit-main {
            padding: 16px 0;
        }

        .admin-edit-container {
            padding: 0 12px;
        }

        .header-content,
        .add-form-container,
        .admin-grid {
            padding: 16px;
        }

        .section-header {
            padding: 16px;
        }
    }
</style>