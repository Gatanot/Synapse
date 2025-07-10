<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ActionData, PageData } from './$types';
    import type { AdminClient, ArticleClient } from '$lib/types/client';

    let { data, form } = $props<{ 
        data: PageData & { 
            admin: AdminClient; 
            articles: ArticleClient[];
            searchedArticle: ArticleClient | null;
            searchError: string | null;
            searchId: string | null;
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
            goto('/admin/articles');
            return;
        }
        isSearching = true;
        goto(`/admin/articles?id=${encodeURIComponent(searchId.trim())}`);
    }

    function clearSearch() {
        searchId = '';
        goto('/admin/articles');
    }

    function confirmDelete(articleId: string) {
        deleteConfirmId = articleId;
    }

    function cancelDelete() {
        deleteConfirmId = null;
    }

    function viewArticle(articleId: string) {
        window.open(`/articles/${articleId}`, '_blank');
    }

    function viewAuthor(authorId: string) {
        window.open(`/users/${authorId}`, '_blank');
    }
</script>

<svelte:head>
    <title>已发布文章管理 - Synapse</title>
    <meta name="description" content="管理平台已发布文章，查看24小时内更新的已发布文章或根据ID搜索文章" />
</svelte:head>

<main class="admin-articles-main">
    <div class="admin-articles-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-content">
                <button class="back-button" onclick={goBack} type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    返回管理后台
                </button>
                <h1>已发布文章管理</h1>
                <div class="admin-badge">
                    管理员
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
                {data.searchError}
            </div>
        {/if}

        <!-- 搜索区域 -->
        <div class="search-section">
            <div class="section-header">
                <h2>搜索文章</h2>
            </div>
            <div class="search-container">
                <div class="search-input-group">
                    <input 
                        type="text"
                        bind:value={searchId}
                        placeholder="请输入文章ID"
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
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    {/if}
                </div>
                <p class="search-hint">输入完整的文章ID来搜索特定已发布文章，留空显示24小时内更新的已发布文章</p>
            </div>
        </div>

        <!-- 文章列表或搜索结果 -->
        <div class="articles-section">
            <div class="section-header">
                <h2>
                    {#if data.searchId}
                        搜索结果
                    {:else}
                        24小时内更新的已发布文章
                    {/if}
                </h2>
                <div class="articles-count">
                    {#if data.searchedArticle}
                        找到 1 篇文章
                    {:else if data.articles.length > 0}
                        共 {data.articles.length} 篇文章
                    {:else}
                        暂无文章
                    {/if}
                </div>
            </div>

            {#if data.searchedArticle}
                <!-- 单个搜索结果 -->
                <div class="article-card searched-article">
                    <div class="article-header">
                        <h3 class="article-title">{data.searchedArticle.title}</h3>
                        <div class="article-actions">
                            <button 
                                class="view-button"
                                onclick={() => viewArticle(data.searchedArticle!._id)}
                                type="button"
                                title="查看文章"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                </svg>
                            </button>
                            <button 
                                class="delete-button"
                                onclick={() => confirmDelete(data.searchedArticle!._id)}
                                type="button"
                                title="删除文章"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="article-meta">
                        <span class="article-id">ID: {data.searchedArticle._id}</span>
                        <span class="article-author" onclick={() => viewAuthor(data.searchedArticle!.authorId)}>
                            作者: {data.searchedArticle.authorName}
                        </span>
                        <span class="article-likes">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            {data.searchedArticle.likes}
                        </span>
                        <span class="article-date">
                            创建: {formatDate(data.searchedArticle.createdAt)}
                        </span>
                    </div>
                    <p class="article-summary">{data.searchedArticle.summary}</p>
                    {#if data.searchedArticle.tags && data.searchedArticle.tags.length > 0}
                        <div class="article-tags">
                            {#each data.searchedArticle.tags as tag}
                                <span class="tag">{tag}</span>
                            {/each}
                        </div>
                    {/if}
                </div>
            {:else if data.articles.length > 0}
                <!-- 文章列表 -->
                <div class="articles-grid">
                    {#each data.articles as article}
                        <div class="article-card">
                            <div class="article-header">
                                <h3 class="article-title">{article.title}</h3>
                                <div class="article-actions">
                                    <button 
                                        class="view-button"
                                        onclick={() => viewArticle(article._id)}
                                        type="button"
                                        title="查看文章"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </button>
                                    <button 
                                        class="delete-button"
                                        onclick={() => confirmDelete(article._id)}
                                        type="button"
                                        title="删除文章"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="article-meta">
                                <span class="article-id">ID: {article._id}</span>
                                <span class="article-author" onclick={() => viewAuthor(article.authorId)}>
                                    作者: {article.authorName}
                                </span>
                                <span class="article-likes">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                    {article.likes}
                                </span>
                                <span class="article-date">
                                    更新: {formatRelativeTime(article.createdAt)}
                                </span>
                            </div>
                            <p class="article-summary">{article.summary}</p>
                            {#if article.tags && article.tags.length > 0}
                                <div class="article-tags">
                                    {#each article.tags as tag}
                                        <span class="tag">{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- 空状态 -->
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    <h3>
                        {#if data.searchId}
                            未找到文章
                        {:else}
                            暂无文章更新
                        {/if}
                    </h3>
                    <p>
                        {#if data.searchId}
                            请检查文章ID是否正确
                        {:else}
                            在过去24小时内没有文章被创建或更新
                        {/if}
                    </p>
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
                <h3>确认删除文章</h3>
            </div>
            <div class="modal-body">
                <p>确定要删除这篇文章吗？此操作不可撤销，文章的所有相关数据（包括评论和点赞）都将被删除。</p>
            </div>
            <div class="modal-actions">
                <form method="POST" action="?/deleteArticle" use:enhance={() => {
                    isDeleting = true;
                    return async ({ update }) => {
                        isDeleting = false;
                        await update();
                        deleteConfirmId = null;
                        if (form?.success) {
                            await invalidateAll();
                        }
                    };
                }}>
                    <input type="hidden" name="articleId" value={deleteConfirmId} />
                    <button type="submit" class="confirm-delete-button" disabled={isDeleting}>
                        {isDeleting ? '删除中...' : '确认删除'}
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
    .admin-articles-main {
        min-height: 100vh;
        background: var(--admin-bg-primary);
        padding: 24px 0;
    }

    .admin-articles-container {
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
    .articles-section {
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

    .articles-count {
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
        margin: 0;
        font-size: 13px;
        color: var(--admin-text-tertiary);
        line-height: 1.4;
    }

    /* 文章卡片 */
    .articles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 16px;
        padding: 24px;
    }

    .article-card {
        border: 1px solid var(--admin-border-color);
        border-radius: var(--admin-radius-md);
        background: var(--admin-bg-secondary);
        transition: var(--admin-transition);
        overflow: hidden;
    }

    .article-card:hover {
        box-shadow: var(--admin-shadow-medium);
        border-color: var(--admin-border-hover);
    }

    .searched-article {
        margin: 24px;
        border: 2px solid var(--admin-accent-color);
    }

    .article-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        border-bottom: 1px solid var(--admin-border-color);
        background: var(--admin-bg-tertiary);
    }

    .article-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--admin-text-primary);
        line-height: 1.4;
        flex: 1;
        margin-right: 16px;
    }

    .article-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
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

    .delete-button:hover {
        background: var(--admin-danger-hover);
    }

    .view-button svg,
    .delete-button svg {
        width: 16px;
        height: 16px;
    }

    .article-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 16px;
        font-size: 13px;
        color: var(--admin-text-secondary);
        border-bottom: 1px solid var(--admin-border-color);
    }

    .article-id {
        font-family: monospace;
        background: var(--admin-bg-tertiary);
        padding: 2px 8px;
        border-radius: var(--admin-radius-sm);
        font-size: 12px;
    }

    .article-author {
        cursor: pointer;
        color: var(--admin-accent-color);
        text-decoration: none;
    }

    .article-author:hover {
        text-decoration: underline;
    }

    .article-likes {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .article-likes svg {
        width: 14px;
        height: 14px;
        color: var(--admin-danger-color);
    }

    .article-summary {
        padding: 16px;
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--admin-text-secondary);
    }

    .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 16px;
        border-top: 1px solid var(--admin-border-color);
    }

    .tag {
        background: var(--admin-bg-tertiary);
        color: var(--admin-text-secondary);
        padding: 4px 8px;
        border-radius: var(--admin-radius-sm);
        font-size: 12px;
        font-weight: 500;
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

    .confirm-delete-button:hover:not(:disabled) {
        background: var(--admin-danger-hover);
        box-shadow: var(--admin-shadow-medium);
    }

    .confirm-delete-button:disabled {
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

    /* 响应式设计 */
    @media (max-width: 768px) {
        .admin-articles-container {
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

        .articles-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
        }

        .search-input-group {
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

        .article-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }

        .article-title {
            margin-right: 0;
        }

        .article-meta {
            flex-direction: column;
            gap: 8px;
        }
    }

    @media (max-width: 480px) {
        .admin-articles-main {
            padding: 16px 0;
        }

        .admin-articles-container {
            padding: 0 12px;
        }

        .search-container,
        .articles-grid {
            padding: 16px;
        }

        .section-header {
            padding: 16px;
        }
    }
</style>