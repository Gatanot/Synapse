<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ActionData, PageData } from './$types';
    import type { AdminClient, UserClient } from '$lib/types/client';

    let { data, form } = $props<{ 
        data: PageData & { 
            admin: AdminClient; 
            users: (UserClient & { isAdmin: boolean; adminPriority?: number })[];
            searchedUser: (UserClient & { isAdmin: boolean; adminPriority?: number }) | null;
            searchError: string | null;
            searchId: string | null;
            filter: string;
        };
        form: ActionData;
    }>();

    let searchId = $state(data.searchId || '');
    let isSearching = $state(false);
    let deleteConfirmId = $state<string | null>(null);
    let isDeleting = $state(false);

    // 监听数据变化，重置搜索状态
    $effect(() => {
        // 当页面数据更新时（搜索完成后），重置搜索状态
        isSearching = false;
        // 同步搜索ID
        searchId = data.searchId || '';
    });

    function goBack() {
        goto('/admin');
    }

    function handleKeydown(event: KeyboardEvent, action: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    }

    function formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else {
            return formatDate(date);
        }
    }

    function handleSearch() {
        if (!searchId.trim()) {
            goto('/admin/users');
            return;
        }
        isSearching = true;
        goto(`/admin/users?id=${encodeURIComponent(searchId.trim())}`);
    }

    function clearSearch() {
        searchId = '';
        goto('/admin/users');
    }

    function handleFilterChange(newFilter: string) {
        const url = new URL(window.location.href);
        if (newFilter === 'all') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', newFilter);
        }
        goto(url.pathname + url.search);
    }

    function getFilterTitle(): string {
        switch (data.filter) {
            case 'recent':
                return '24小时内更新的用户';
            case 'admins':
                return '管理员用户';
            case 'users':
                return '普通用户';
            default:
                return '所有用户';
        }
    }

    function confirmDelete(userId: string) {
        deleteConfirmId = userId;
    }

    function cancelDelete() {
        deleteConfirmId = null;
    }

    function getRoleBadgeClass(user: UserClient & { isAdmin: boolean; adminPriority?: number }): string {
        if (!user.isAdmin) return 'role-user';
        if (user.adminPriority === 0) return 'role-super-admin';
        return 'role-admin';
    }

    function getRoleText(user: UserClient & { isAdmin: boolean; adminPriority?: number }): string {
        if (!user.isAdmin) return '普通用户';
        
        // 根据优先级区分管理员类型
        if (user.adminPriority === 0) {
            return '超级管理员';
        } else if (user.adminPriority === 1) {
            return '管理员';
        }
        
        return '管理员'; // 默认显示为管理员
    }

    function viewUser(userId: string) {
        window.open(`/users/${userId}`, '_blank');
    }

    function canDeleteUser(user: UserClient & { isAdmin: boolean; adminPriority?: number }): boolean {
        // 不能删除自己
        if (user._id === data.admin.userId) {
            return false;
        }
        
        // 超级管理员可以删除任何用户（除了自己）
        if (data.admin.priority === 0) {
            return true;
        }
        
        // 普通管理员只能删除非管理员用户
        if (data.admin.priority === 1) {
            return !user.isAdmin;
        }
        
        return false;
    }

    function getDeleteTooltip(user: UserClient & { isAdmin: boolean; adminPriority?: number }): string {
        if (user._id === data.admin.userId) {
            return '不能删除自己';
        }
        if (!canDeleteUser(user)) {
            return '您没有权限删除此用户';
        }
        return '删除用户';
    }
</script>

<svelte:head>
    <title>用户管理 - Synapse</title>
    <meta name="description" content="管理平台用户，查看24小时内更新的用户或根据ID搜索用户" />
</svelte:head>

<main class="admin-users-main">
    <div class="admin-users-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-content">
                <button class="back-button" onclick={goBack} type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    返回管理后台
                </button>
                <h1>用户管理</h1>
                <div class="admin-badge">
                    {data.admin.priority === 0 ? '超级管理员' : '管理员'}
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

        {#if data.searchError}
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <div>
                    <p>{data.searchError}</p>
                    {#if data.searchError?.includes('加载用户列表时发生错误')}
                        <button 
                            class="retry-button" 
                            onclick={() => window.location.reload()}
                            type="button"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                            重试
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- 搜索区域 -->
        <div class="search-section">
            <div class="section-header">
                <h2>搜索用户</h2>
            </div>
            <div class="search-container">
                <div class="search-input-group">
                    <input 
                        type="text"
                        bind:value={searchId}
                        placeholder="请输入用户ID"
                        class="search-input"
                        onkeydown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        class="search-button" 
                        onclick={handleSearch}
                        disabled={isSearching}
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        {isSearching ? '搜索中...' : '搜索'}
                    </button>
                    {#if data.searchId}
                        <button 
                            class="clear-button" 
                            onclick={clearSearch}
                            type="button"
                            title="清除搜索"
                            aria-label="清除搜索"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                <p class="search-hint">输入完整的用户ID来搜索特定用户，或使用下方筛选功能浏览用户</p>
                
                <!-- 筛选按钮组 -->
                <div class="filter-group">
                    <button 
                        class="filter-button {data.filter === 'all' || !data.filter ? 'active' : ''}"
                        onclick={() => handleFilterChange('all')}
                        type="button"
                    >
                        所有用户
                    </button>
                    <button 
                        class="filter-button {data.filter === 'recent' ? 'active' : ''}"
                        onclick={() => handleFilterChange('recent')}
                        type="button"
                    >
                        最近活跃
                    </button>
                    <button 
                        class="filter-button {data.filter === 'admins' ? 'active' : ''}"
                        onclick={() => handleFilterChange('admins')}
                        type="button"
                    >
                        管理员
                    </button>
                    <button 
                        class="filter-button {data.filter === 'users' ? 'active' : ''}"
                        onclick={() => handleFilterChange('users')}
                        type="button"
                    >
                        普通用户
                    </button>
                </div>
            </div>
        </div>

        <!-- 用户列表或搜索结果 -->
        <div class="users-section">
            <div class="section-header">
                <h2>
                    {#if data.searchId}
                        搜索结果
                    {:else}
                        {getFilterTitle()}
                    {/if}
                </h2>
                <div class="users-count">
                    {#if data.searchedUser}
                        找到 1 个用户
                    {:else if data.users.length > 0}
                        共 {data.users.length} 个用户
                    {:else}
                        暂无用户
                    {/if}
                </div>
            </div>

            {#if data.searchedUser}
                <!-- 单个搜索结果表格 -->
                <div class="users-table-container searched-result">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>用户ID</th>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>文章数</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="user-row">
                                <td class="user-id">
                                    <code class="id-code">{data.searchedUser._id}</code>
                                </td>
                                <td class="user-name">{data.searchedUser.name}</td>
                                <td class="user-email">{data.searchedUser.email}</td>
                                <td class="user-role">
                                    <span class="role-badge {getRoleBadgeClass(data.searchedUser)}">
                                        {getRoleText(data.searchedUser)}
                                    </span>
                                </td>
                                <td class="user-articles">{data.searchedUser.articles.length}</td>
                                <td class="user-date">{formatDate(data.searchedUser.createdAt)}</td>
                                <td class="user-actions">
                                    <button 
                                        class="view-button"
                                        onclick={() => viewUser(data.searchedUser!._id)}
                                        type="button"
                                        title="查看用户主页"
                                        aria-label="查看用户主页"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </button>
                                    {#if canDeleteUser(data.searchedUser)}
                                        <button 
                                            class="delete-button"
                                            onclick={() => confirmDelete(data.searchedUser!._id)}
                                            type="button"
                                            title={getDeleteTooltip(data.searchedUser)}
                                            aria-label={getDeleteTooltip(data.searchedUser)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    {:else}
                                        <span class="delete-disabled" title={getDeleteTooltip(data.searchedUser)}>
                                            -
                                        </span>
                                    {/if}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {#if data.searchedUser.signature}
                        <div class="user-signature-section">
                            <strong>个人签名：</strong>
                            <span class="user-signature">{data.searchedUser.signature}</span>
                        </div>
                    {/if}
                </div>
            {:else if data.users.length > 0}
                <!-- 用户列表表格 -->
                <div class="users-table-container">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>用户ID</th>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>文章数</th>
                                <th>最后更新</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.users as user}
                                <tr class="user-row">
                                    <td class="user-id">
                                        <code class="id-code">{user._id}</code>
                                    </td>
                                    <td class="user-name">{user.name}</td>
                                    <td class="user-email">{user.email}</td>
                                    <td class="user-role">
                                        <span class="role-badge {getRoleBadgeClass(user)}">
                                            {getRoleText(user)}
                                        </span>
                                    </td>
                                    <td class="user-articles">{user.articles.length}</td>
                                    <td class="user-time">{formatRelativeTime(user.updatedAt)}</td>
                                    <td class="user-actions">
                                        <button 
                                            class="view-button"
                                            onclick={() => viewUser(user._id)}
                                            type="button"
                                            title="查看用户主页"
                                            aria-label="查看用户主页"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            </svg>
                                        </button>
                                        {#if canDeleteUser(user)}
                                            <button 
                                                class="delete-button"
                                                onclick={() => confirmDelete(user._id)}
                                                type="button"
                                                title={getDeleteTooltip(user)}
                                                aria-label={getDeleteTooltip(user)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                                </svg>
                                            </button>
                                        {:else}
                                            <span class="delete-disabled" title={getDeleteTooltip(user)}>
                                                -
                                            </span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <!-- 空状态 -->
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <h3>暂无用户数据</h3>
                    <p>
                        {#if data.searchId}
                            没有找到匹配的用户，请检查用户ID是否正确
                        {:else if data.filter === 'recent'}
                            24小时内没有用户更新活动
                        {:else if data.filter === 'admins'}
                            当前没有管理员用户
                        {:else if data.filter === 'users'}
                            当前没有普通用户
                        {:else}
                            当前没有任何用户
                        {/if}
                    </p>
                </div>
            {/if}
        </div>

        <!-- 删除确认弹窗 -->
        {#if deleteConfirmId}
            <div 
                class="modal-mask" 
                onclick={cancelDelete}
                onkeydown={(e) => e.key === 'Escape' && cancelDelete()}
                role="dialog"
                aria-modal="true"
                tabindex="-1"
            >
                <div 
                    class="modal-dialog"
                    role="document"
                >
                    <div class="modal-title">确认删除用户</div>
                    <div class="modal-content">
                        您确定要删除这个用户吗？此操作不可撤销。<br>
                        <span class="warning-text">删除用户将同时删除其所有相关数据，包括文章和评论。</span>
                    </div>
                    <div class="modal-actions">
                        <form 
                            method="post" 
                            action="?/deleteUser"
                            use:enhance={() => {
                                isDeleting = true;
                                return async ({ update }) => {
                                    isDeleting = false;
                                    deleteConfirmId = null;
                                    await update();
                                    await invalidateAll();
                                };
                            }}
                        >
                            <input type="hidden" name="userId" value={deleteConfirmId} />
                            <button 
                                class="btn-primary" 
                                type="submit"
                                disabled={isDeleting}
                            >
                                {isDeleting ? '删除中...' : '确定'}
                            </button>
                        </form>
                        <button type="button" class="btn-secondary" onclick={cancelDelete}>
                            取消
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    /* 使用与文章管理页面一致的设计系统 */
    :root {
        --admin-bg-primary: #fafafa;
        --admin-bg-secondary: #ffffff;
        --admin-bg-tertiary: #f5f5f5;
        --admin-bg-hover: #eeeeee;
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
    .admin-users-main {
        min-height: 100vh;
        background: var(--admin-bg-primary);
        padding: 24px 0;
    }

    .admin-users-container {
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

    /* 区域样式 */
    .search-section,
    .users-section {
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

    .users-count {
        font-size: 14px;
        color: var(--admin-text-secondary);
        background: var(--admin-bg-secondary);
        padding: 4px 12px;
        border-radius: var(--admin-radius-sm);
        border: 1px solid var(--admin-border-color);
    }

    /* 搜索区域 */
    .search-container {
        padding: 24px;
    }

    .search-input-group {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    .search-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-sm);
        font-size: 14px;
        transition: var(--admin-transition);
        background: var(--admin-bg-secondary);
        color: var(--admin-text-primary);
    }

    .search-input:focus {
        outline: none;
        border-color: var(--admin-accent-color);
        box-shadow: 0 0 0 2px rgba(66, 66, 66, 0.1);
    }

    .search-button,
    .clear-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border: none;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: var(--admin-transition);
        box-shadow: var(--admin-shadow-light);
    }

    .search-button {
        background: var(--admin-accent-color);
        color: white;
    }

    .search-button:hover:not(:disabled) {
        background: var(--admin-accent-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    .search-button:disabled {
        background: var(--admin-text-tertiary);
        cursor: not-allowed;
        box-shadow: none;
    }

    .clear-button {
        background: var(--admin-bg-tertiary);
        color: var(--admin-text-secondary);
        border: 1px solid var(--admin-border-color);
        padding: 12px;
    }

    .clear-button:hover {
        background: var(--admin-danger-color);
        color: white;
        border-color: var(--admin-danger-color);
    }

    .search-button svg,
    .clear-button svg {
        width: 16px;
        height: 16px;
    }

    .search-hint {
        margin: 0 0 16px 0;
        font-size: 13px;
        color: var(--admin-text-tertiary);
        line-height: 1.4;
    }

    /* 筛选按钮组 */
    .filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
    }

    .filter-button {
        padding: 8px 16px;
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-sm);
        background: var(--admin-bg-secondary);
        color: var(--admin-text-secondary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: var(--admin-transition);
        white-space: nowrap;
    }

    .filter-button:hover {
        background: var(--admin-bg-tertiary);
        color: var(--admin-text-primary);
        border-color: var(--admin-border-hover);
    }

    .filter-button.active {
        background: var(--admin-accent-color);
        color: white;
        border-color: var(--admin-accent-color);
        box-shadow: var(--admin-shadow-light);
    }

    .filter-button.active:hover {
        background: var(--admin-accent-hover);
        border-color: var(--admin-accent-hover);
    }

    /* 用户表格 */
    .users-table-container {
        overflow-x: auto;
    }

    .searched-result {
        border: 2px solid var(--admin-accent-color);
        margin: 24px;
        border-radius: var(--admin-radius-md);
        overflow: hidden;
    }

    .users-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        background: var(--admin-bg-secondary);
    }

    .users-table th,
    .users-table td {
        padding: 16px 12px;
        text-align: left;
        border-bottom: 1px solid var(--admin-border-color);
    }

    .users-table th {
        background: var(--admin-bg-tertiary);
        font-weight: 600;
        color: var(--admin-text-primary);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .user-row {
        transition: var(--admin-transition);
    }

    .user-row:hover {
        background: var(--admin-bg-tertiary);
    }

    .user-id {
        font-family: var(--admin-font-mono);
        font-size: 12px;
        max-width: 140px;
        position: relative;
    }

    .id-code {
        display: inline-block;
        padding: 4px 8px;
        background: var(--admin-bg-tertiary);
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-sm);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 11px;
        color: var(--admin-text-secondary);
        word-break: break-all;
        line-height: 1.2;
        transition: var(--admin-transition);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .id-code:hover {
        background: var(--admin-bg-hover);
        color: var(--admin-text-primary);
        border-color: var(--admin-border-hover);
        white-space: normal;
        word-break: break-all;
        overflow: visible;
        z-index: 10;
        position: relative;
        box-shadow: var(--admin-shadow-medium);
    }

    .user-name {
        font-weight: 600;
        color: var(--admin-text-primary);
    }

    .user-email {
        color: var(--admin-text-secondary);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .role-badge {
        padding: 4px 8px;
        border-radius: var(--admin-radius-sm);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
    }

    .role-admin {
        background: #fff3e0;
        color: var(--admin-warning-color);
        border: 1px solid #ffcc02;
    }

    .role-super-admin {
        background: linear-gradient(135deg, #ff6b6b, #ffd93d);
        color: white;
        border: 1px solid #ff6b6b;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        box-shadow: 0 2px 4px rgba(255, 107, 107, 0.2);
    }

    .role-user {
        background: #e8f5e8;
        color: var(--admin-success-color);
        border: 1px solid #c8e6c9;
    }

    .user-articles {
        color: var(--admin-text-secondary);
        font-weight: 500;
    }

    .user-date,
    .user-time {
        color: var(--admin-text-tertiary);
        font-size: 13px;
    }

    .user-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .view-button,
    .delete-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--admin-radius-sm);
        cursor: pointer;
        transition: var(--admin-transition);
    }

    .view-button {
        background: var(--admin-accent-color);
        color: white;
    }

    .view-button:hover {
        background: var(--admin-accent-hover);
    }

    .delete-button {
        background: var(--admin-danger-color);
        color: white;
    }

    .delete-button:hover:not(:disabled) {
        background: var(--admin-danger-hover);
    }

    .delete-button:disabled {
        background: var(--admin-text-tertiary);
        cursor: not-allowed;
        opacity: 0.5;
    }

    .view-button svg,
    .delete-button svg {
        width: 16px;
        height: 16px;
    }

    /* 删除按钮禁用状态 */
    .delete-disabled {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        font-size: 16px;
        color: var(--admin-text-tertiary);
        cursor: not-allowed;
        user-select: none;
        background: transparent;
    }

    /* 用户签名区域 */
    .user-signature-section {
        padding: 16px 24px;
        background: var(--admin-bg-tertiary);
        border-top: 1px solid var(--admin-border-color);
        font-size: 14px;
        color: var(--admin-text-secondary);
    }

    .user-signature {
        font-style: italic;
        margin-left: 8px;
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

    /* 弹窗样式 - 与网站主题保持一致 */
    .modal-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.25);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-dialog {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        padding: 2rem 2.5rem 1.5rem 2.5rem;
        min-width: 280px;
        max-width: 90vw;
        text-align: center;
        animation: modalIn 0.18s cubic-bezier(0.4, 1.6, 0.6, 1) both;
    }

    @keyframes modalIn {
        from { 
            transform: scale(0.95) translateY(30px); 
            opacity: 0; 
        }
        to { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
        }
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #212121; /* 直接使用主题色值 */
    }

    .modal-content {
        color: #757575; /* 直接使用主题色值 */
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .warning-text {
        color: #f44336;
        font-weight: 500;
        display: block;
        margin-top: 0.5rem;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .btn-primary {
        background-color: #212121;
        color: #fff;
        border: none;
        padding: 0.6rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #000;
    }

    .btn-primary:disabled {
        background-color: #9e9e9e;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: #f5f5f5;
        color: #757575;
        border: 1px solid #e0e0e0;
        padding: 0.6rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }

    .btn-secondary:hover {
        background-color: #e0e0e0;
        color: #212121;
        border-color: #212121;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
        .admin-users-container {
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

        .search-input-group {
            flex-direction: column;
        }

        .filter-group {
            justify-content: center;
        }

        .filter-button {
            flex: 1;
            min-width: 80px;
        }

        .modal-footer {
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

        .users-table {
            font-size: 12px;
        }

        .users-table th,
        .users-table td {
            padding: 12px 8px;
        }

        .user-id,
        .user-email {
            max-width: 100px;
        }

        .user-actions {
            flex-direction: column;
            gap: 4px;
        }

        .view-button,
        .delete-button {
            width: 28px;
            height: 28px;
        }
    }

    @media (max-width: 480px) {
        .admin-users-main {
            padding: 16px 0;
        }

        .admin-users-container {
            padding: 0 12px;
        }

        .search-container {
            padding: 16px;
        }

        .section-header {
            padding: 16px;
        }

        .users-table th,
        .users-table td {
            padding: 8px 6px;
        }

        .user-signature-section {
            padding: 12px 16px;
        }
    }
</style>
