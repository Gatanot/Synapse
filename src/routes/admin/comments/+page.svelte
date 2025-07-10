<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ActionData, PageData } from './$types';
    import type { AdminClient, CommentClient } from '$lib/types/client';
    import Modal from '$lib/components/Modal.svelte';

    let { data, form } = $props<{ 
        data: PageData & { 
            admin: AdminClient; 
            newComments: CommentClient[];
            searchResults: CommentClient[];
            commentsError: string | null;
            searchError: string | null;
            searchTerm: string;
            lastVisit: string;
        };
        form: ActionData;
    }>();

    let searchQuery = $state(data.searchTerm || '');
    let isSearching = $state(false);
    let deleteConfirmId = $state<string | null>(null);
    let isDeleting = $state(false);

    // 根据是否有搜索词决定显示哪些评论
    let displayComments = $derived(data.searchTerm ? data.searchResults : data.newComments);
    let isSearchMode = $derived(!!data.searchTerm);

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

    function confirmDelete(commentId: string) {
        deleteConfirmId = commentId;
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

    // 获取上次访问时间的显示文本
    function getLastVisitText(): string {
        const lastVisitDate = new Date(data.lastVisit);
        return formatDate(lastVisitDate);
    }

    // 处理搜索
    function handleSearch() {
        if (!searchQuery.trim()) {
            // 如果搜索框为空，回到正常模式
            goto('/admin/comments');
            return;
        }
        
        isSearching = true;
        goto(`/admin/comments?search=${encodeURIComponent(searchQuery.trim())}`);
    }

    // 清除搜索
    function clearSearch() {
        searchQuery = '';
        goto('/admin/comments');
    }

    // 监听页面数据变化，重置搜索状态
    $effect(() => {
        isSearching = false;
        searchQuery = data.searchTerm || '';
    });
</script>

<svelte:head>
    <title>评论管理 - Synapse</title>
    <meta name="description" content="管理平台评论，查看新增评论并进行审核" />
</svelte:head>

<main class="admin-comments-main">
    <div class="admin-comments-container">
        <!-- 页面头部 -->
        <div class="page-header">
            <div class="header-content">
                <button class="back-button" onclick={goBack} type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    返回管理后台
                </button>
                <h1>评论管理</h1>
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

        {#if data.commentsError}
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {data.commentsError}
            </div>
        {/if}

        <!-- 搜索错误提示 -->
        {#if data.searchError}
            <div class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {data.searchError}
            </div>
        {/if}

        <!-- 搜索框 -->
        <div class="search-section">
            <div class="section-header">
                <h2>搜索评论</h2>
            </div>
            <div class="search-container">
                <input 
                    type="text" 
                    class="search-input"
                    placeholder="搜索评论内容或作者名..."
                    bind:value={searchQuery}
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
                {#if data.searchTerm}
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
            <p class="search-hint">支持搜索评论内容和作者用户名</p>
        </div>

        <!-- 搜索结果 -->
        {#if isSearchMode}
            <div class="comments-section">
                <div class="section-header">
                    <h2>搜索结果</h2>
                    <div class="comments-info">
                        <span class="search-term">"{data.searchTerm}"</span>
                        <div class="comments-count">
                            {#if data.searchResults.length > 0}
                                找到 {data.searchResults.length} 条评论
                            {:else}
                                未找到相关评论
                            {/if}
                        </div>
                    </div>
                </div>

                {#if data.searchResults.length > 0}
                    <!-- 搜索结果网格 -->
                    <div class="comments-grid">
                        {#each data.searchResults as comment}
                            <div class="comment-card">
                                <div class="comment-header">
                                    <div class="comment-meta">
                                        <span class="comment-id">ID: {comment._id}</span>
                                        <span class="comment-author" onclick={() => viewAuthor(comment.authorId)}>
                                            作者: {comment.authorName}
                                        </span>
                                        <span class="comment-time">
                                            时间: {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <div class="comment-actions">
                                        <button 
                                            class="view-button"
                                            onclick={() => viewArticle(comment.articleId)}
                                            type="button"
                                            title="查看所属文章"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            </svg>
                                        </button>
                                        <button 
                                            class="delete-button"
                                            onclick={() => confirmDelete(comment._id)}
                                            type="button"
                                            title="删除评论"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="comment-content">
                                    <p class="comment-text">{comment.content}</p>
                                </div>
                                <div class="comment-footer">
                                    <button 
                                        class="article-link"
                                        onclick={() => viewArticle(comment.articleId)}
                                        type="button"
                                    >
                                        查看所属文章
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <!-- 搜索无结果 -->
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <h3>未找到相关评论</h3>
                        <p>没有找到包含 "{data.searchTerm}" 的评论</p>
                        <p>尝试使用其他关键词搜索</p>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- 新评论列表 -->
        {#if !isSearchMode}
            <div class="comments-section">
                <div class="section-header">
                    <h2>新增评论</h2>
                    <div class="comments-info">
                        <span class="last-visit">上次访问: {getLastVisitText()}</span>
                        <div class="comments-count">
                            {#if data.newComments.length > 0}
                                共 {data.newComments.length} 条新评论
                            {:else}
                                暂无新评论
                            {/if}
                        </div>
                    </div>
                </div>

                {#if data.newComments.length > 0}
                    <!-- 评论网格 -->
                    <div class="comments-grid">
                        {#each data.newComments as comment}
                            <div class="comment-card">
                                <div class="comment-header">
                                    <div class="comment-meta">
                                        <span class="comment-id">ID: {comment._id}</span>
                                        <span class="comment-author" onclick={() => viewAuthor(comment.authorId)}>
                                            作者: {comment.authorName}
                                        </span>
                                        <span class="comment-time">
                                            时间: {formatRelativeTime(comment.createdAt)}
                                        </span>
                                    </div>
                                    <div class="comment-actions">
                                        <button 
                                            class="view-button"
                                            onclick={() => viewArticle(comment.articleId)}
                                            type="button"
                                            title="查看所属文章"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                            </svg>
                                        </button>
                                        <button 
                                            class="delete-button"
                                            onclick={() => confirmDelete(comment._id)}
                                            type="button"
                                            title="删除评论"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="comment-content">
                                    <p class="comment-text">{comment.content}</p>
                                </div>
                                <div class="comment-footer">
                                    <button 
                                        class="article-link"
                                        onclick={() => viewArticle(comment.articleId)}
                                        type="button"
                                    >
                                        查看所属文章
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <!-- 空状态 -->
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            <path d="M7 9h10M7 13h6"/>
                        </svg>
                        <h3>暂无新评论</h3>
                        <p>自上次访问以来没有新的评论</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</main>

<!-- 删除确认弹窗 -->
{#if deleteConfirmId}
    <Modal
        title="确认删除评论"
        content="确定要删除这条评论吗？此操作不可撤销。"
        confirmText={isDeleting ? '删除中...' : '确认删除'}
        cancelText="取消"
        loading={isDeleting}
        formAction="?/deleteComment"
        formData={{ commentId: deleteConfirmId }}
        useEnhance={true}
        on:beforeSubmit={() => { isDeleting = true; }}
        on:afterSubmit={async () => {
            isDeleting = false;
            deleteConfirmId = null;
            if (form?.success) {
                await invalidateAll();
            }
        }}
        on:cancel={cancelDelete}
    />
{/if}

<style>
    /* 
      设计理念: 继承网站的核心设计语言
      - 使用一致的黑白灰配色系统
      - 遵循 Material Design 的阴影和交互原则
      - 强调内容的可读性和人文关怀
    */

    /* 主体布局 */
    .admin-comments-main {
        min-height: 100vh;
        background-color: var(--background);
        padding: 2rem 0;
    }

    .admin-comments-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }

    /* 
      设计理念: 页面头部 - 与主管理页面保持一致
      - 使用相同的卡片设计语言
      - 保持简洁的布局和清晰的层次
    */
    .page-header {
        margin-bottom: 2rem;
    }

    .header-content {
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        padding: 2rem;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        color: var(--text-primary);
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease,
            transform var(--transition-speed) ease;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
    }

    .back-button:hover {
        background-color: var(--hover-bg);
        border-color: var(--text-primary);
        transform: translateX(-2px);
    }

    .back-button svg {
        width: 1rem;
        height: 1rem;
    }

    .header-content h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
        flex-grow: 1;
        letter-spacing: -0.5px;
    }

    .admin-badge {
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius-md);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background-color: var(--text-primary);
        color: #ffffff;
        border: 1px solid var(--text-primary);
    }

    /* 
      设计理念: 消息提示 - 与网站其他页面保持一致
      - 使用温和的颜色和清晰的图标
      - 提供清晰的视觉反馈
    */
    .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: var(--border-radius-md);
        margin-bottom: 1.5rem;
        font-weight: 500;
        font-size: 0.875rem;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .alert svg {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
    }

    .alert-error {
        background-color: #fef7f7;
        border: 1px solid #fecaca;
        color: #dc2626;
    }

    .alert-success {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;
    }

    /* 
      设计理念: 评论区域 - 继承网站的卡片设计语言
      - 使用一致的白色背景和微妙阴影
      - 清晰的内容分区和层次结构
    */
    .comments-section {
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--border-color);
        overflow: hidden;
        margin-bottom: 2rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--background);
    }

    .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.25px;
    }

    .comments-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
    }

    .last-visit {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .comments-count {
        font-size: 0.875rem;
        color: var(--text-primary);
        background-color: #ffffff;
        padding: 0.25rem 0.75rem;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-color);
        font-weight: 500;
    }

    /* 
      设计理念: 搜索功能样式 - 与网站整体设计保持一致
      - 简洁明了的搜索界面
      - 清晰的状态反馈和交互
    */
    .search-section {
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--border-color);
        overflow: hidden;
        margin-bottom: 2rem;
    }

    .search-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1.5rem 2rem;
    }

    .search-input {
        flex: 1;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--text-primary);
        background-color: #ffffff;
        transition: 
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
    }

    .search-input:focus {
        outline: none;
        border-color: var(--text-primary);
        box-shadow: 0 0 0 2px rgba(33, 33, 33, 0.1);
    }

    .search-input::placeholder {
        color: var(--text-secondary);
        font-style: italic;
    }

    .search-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        font-weight: 500;
        font-size: 0.875rem;
        transition: 
            background-color var(--transition-speed) ease,
            transform var(--transition-speed) ease;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        background-color: var(--text-primary);
        color: #ffffff;
    }

    .search-button:hover:not(:disabled) {
        background-color: var(--text-secondary);
        transform: translateY(-1px);
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.08),
            0 8px 16px rgba(0, 0, 0, 0.06);
    }

    .search-button:disabled {
        background-color: var(--text-secondary);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        opacity: 0.6;
    }

    .search-button svg {
        width: 1rem;
        height: 1rem;
    }

    .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        background-color: #ffffff;
        color: var(--text-secondary);
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }

    .clear-button:hover {
        background-color: #fef7f7;
        border-color: #dc2626;
        color: #dc2626;
    }

    .clear-button svg {
        width: 1rem;
        height: 1rem;
    }

    .search-hint {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
        padding: 0 2rem 1.5rem 2rem;
        font-style: italic;
    }

    /* 搜索结果相关样式 */
    .search-term {
        font-weight: 600;
        color: var(--text-primary);
        background-color: #ffffff;
        padding: 0.25rem 0.5rem;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-color);
        font-size: 0.75rem;
    }

    /* 
      设计理念: 响应式搜索界面
      - 在小屏幕上保持良好的可用性
      - 适当调整间距和按钮尺寸
    */
    @media (max-width: 768px) {
        .search-container {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
        }

        .search-button {
            justify-content: center;
        }

        .clear-button {
            align-self: center;
        }

        .search-hint {
            padding: 0 1.5rem 1.25rem 1.5rem;
            text-align: center;
        }
    }

    @media (max-width: 480px) {
        .search-container {
            padding: 1rem;
        }

        .search-hint {
            padding: 0 1rem 1rem 1rem;
        }
    }

    /* 
      设计理念: 评论网格 - 响应式卡片布局
      - 使用CSS Grid实现自适应布局
      - 卡片间距和大小保持一致性
    */
    .comments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
        padding: 2rem;
    }

    /* 
      设计理念: 评论卡片 - 继承网站的核心卡片设计
      - 使用微妙的悬停效果和过渡动画
      - 清晰的内容层次和操作区域
    */
    .comment-card {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        transition: 
            transform var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
        overflow: hidden;
    }

    .comment-card:hover {
        transform: translateY(-2px);
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.08),
            0 8px 16px rgba(0, 0, 0, 0.06);
        border-color: var(--text-secondary);
    }

    .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.25rem;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--background);
    }

    .comment-meta {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        flex: 1;
    }

    .comment-id {
        font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        background-color: #ffffff;
        padding: 0.125rem 0.5rem;
        border-radius: var(--border-radius-sm);
        font-size: 0.75rem;
        color: var(--text-secondary);
        align-self: flex-start;
        border: 1px solid var(--border-color);
    }

    .comment-author {
        cursor: pointer;
        color: var(--text-primary);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color var(--transition-speed) ease;
    }

    .comment-author:hover {
        color: var(--highlight-color);
        text-decoration: underline;
    }

    .comment-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    /* 
      设计理念: 操作按钮 - 使用一致的按钮设计语言
      - 清晰的视觉层次和操作反馈
      - 符合人文关怀的颜色选择
    */
    .comment-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .view-button,
    .delete-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            transform var(--transition-speed) ease;
    }

    .view-button {
        background-color: var(--text-primary);
        color: #ffffff;
    }

    .view-button:hover {
        background-color: var(--text-secondary);
        transform: scale(1.05);
    }

    .delete-button {
        background-color: #dc2626;
        color: #ffffff;
    }

    .delete-button:hover {
        background-color: #b91c1c;
        transform: scale(1.05);
    }

    .view-button svg,
    .delete-button svg {
        width: 1rem;
        height: 1rem;
    }

    .comment-content {
        padding: 1.25rem;
    }

    .comment-text {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--text-primary);
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .comment-footer {
        padding: 0.75rem 1.25rem;
        border-top: 1px solid var(--border-color);
        background-color: var(--background);
    }

    .article-link {
        font-size: 0.75rem;
        color: var(--text-primary);
        cursor: pointer;
        text-decoration: none;
        background: none;
        border: none;
        padding: 0;
        font-weight: 500;
        transition: color var(--transition-speed) ease;
    }

    .article-link:hover {
        color: var(--highlight-color);
        text-decoration: underline;
    }

    /* 
      设计理念: 空状态 - 友好的用户体验
      - 使用温和的视觉元素
      - 清晰的层次结构和信息传达
    */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--text-secondary);
    }

    .empty-state svg {
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.4;
        color: var(--text-secondary);
    }

    .empty-state h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1.125rem;
        font-weight: 600;
    }

    .empty-state p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    /* 
      设计理念: 响应式设计 - 保持在各种设备上的良好体验
      - 优雅的布局适配
      - 保持内容的可读性和操作的便利性
    */
    @media (max-width: 768px) {
        .admin-comments-container {
            padding: 0 1rem;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
        }

        .header-content h1 {
            font-size: 1.5rem;
        }

        .comments-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1.5rem;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1.25rem 1.5rem;
        }

        .comments-info {
            align-items: flex-start;
        }
    }

    @media (max-width: 480px) {
        .admin-comments-main {
            padding: 1rem 0;
        }

        .admin-comments-container {
            padding: 0 0.75rem;
        }

        .comments-grid {
            padding: 1rem;
        }

        .section-header {
            padding: 1rem;
        }

        .comment-header,
        .comment-content,
        .comment-footer {
            padding: 1rem;
        }
    }
</style>