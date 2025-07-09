<script lang="ts">
    import { goto } from "$app/navigation";
    
    let { data } = $props();
    let drafts = $state([...data.drafts]);

    function toEditDraft(id: string) {
        goto(`/my/drafts/${id}/edit`);
    }

    async function deleteDraft(id: string) {
        if (!confirm('确定要删除这篇草稿吗？此操作不可撤销。')) return;
        try {
            const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                // 立即移除前端列表
                drafts = drafts.filter(draft => draft._id !== id);
            } else {
                alert(result.message || '删除失败');
            }
        } catch (e) {
            alert('网络错误，删除失败');
        }
    }

    async function publishDraft(id: string) {
        if (!confirm('确定要发布这篇草稿吗？发布后将对所有人可见。')) return;
        try {
            const res = await fetch(`/api/drafts/${id}/publish`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                // 发布成功，从草稿列表中移除
                drafts = drafts.filter(draft => draft._id !== id);
                alert('草稿发布成功！');
                // 可选：跳转到已发布的文章页面
                // goto(`/articles/${id}`);
            } else {
                alert(result.message || '发布失败');
            }
        } catch (e) {
            alert('网络错误，发布失败');
        }
    }

    function toNewArticle() {
        goto('/my/articles/new');
    }
</script>

<svelte:head>
    <title>我的草稿 - Synapse</title>
    <meta name="description" content="管理您的文章草稿" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <h1>我的草稿</h1>
        <p class="page-description">管理您尚未发布的文章草稿</p>
    </section>

    {#if drafts && drafts.length > 0}
        <div class="drafts-grid">
            {#each drafts as draft (draft._id)}
                <div class="draft-row">
                    <div class="draft-card-wrapper">
                        <!-- 文章内容直接展示 -->
                        <div class="draft-content">
                            <h2>
                                <button 
                                    type="button"
                                    onclick={() => toEditDraft(draft._id)} 
                                    class="title-link"
                                >
                                    {draft.title}
                                </button>
                            </h2>
                            <div class="draft-meta">
                                <span class="author">
                                    <button 
                                        type="button"
                                        onclick={() => goto(`/users/${draft.authorId}`)}
                                        class="author-link"
                                    >
                                        {draft.authorName}
                                    </button>
                                </span>
                                <span class="date">
                                    {new Date(draft.createdAt).toLocaleDateString()}
                                </span>
                                <span class="status">草稿状态</span>
                            </div>
                            <p class="draft-summary">
                                {draft.summary.length > 30
                                    ? draft.summary.slice(0, 30) + "..."
                                    : draft.summary}
                            </p>
                            {#if draft.tags && draft.tags.length > 0}
                                <div class="draft-tags">
                                    {#each draft.tags as tag (tag)}
                                        <span class="tag">{tag}</span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="draft-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            <span>草稿</span>
                        </div>
                    </div>
                    <div class="draft-actions">
                        <button 
                            type="button"
                            onclick={() => toEditDraft(draft._id)}
                            class="edit-btn"
                            title="编辑草稿"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                            编辑
                        </button>
                        <button 
                            type="button"
                            onclick={() => publishDraft(draft._id)}
                            class="publish-btn"
                            title="发布草稿"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                            </svg>
                            发布
                        </button>
                        <button 
                            type="button"
                            onclick={() => deleteDraft(draft._id)}
                            class="delete-btn"
                            title="删除草稿"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                            </svg>
                            删除
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="empty-state">
            <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
            </div>
            <h3>还没有草稿</h3>
            <p>您还没有保存任何草稿。开始创作您的第一篇文章吧！</p>
            <button type="button" onclick={toNewArticle} class="new-article-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
                创建新文章
            </button>
        </div>
    {/if}
</main>

<style>
    /* 
      设计理念: 完全采用主站黑白灰配色系统
      - 严格遵循 layout.svelte 中定义的 CSS 变量
      - 与 ArticleCard 和主页操作卡片保持视觉一致
      - 采用主站相同的阴影、圆角、过渡等设计语言
      - 确保完全的黑白灰配色，无任何彩色元素
    */

    /* 页面头部样式 - 与主站布局完全一致 */
    .page-header {
        margin-bottom: 2.5rem;
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary); /* #212121 */
        margin: 0 0 0.75rem 0;
        letter-spacing: -0.5px; /* 与主站logo保持一致的字间距 */
    }

    .page-description {
        margin: 0;
        color: var(--text-secondary); /* #757575 */
        font-size: 1.1rem;
        line-height: 1.5;
    }

    /* 草稿网格布局 - 与ArticleCard网格系统一致 */
    .drafts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* 草稿卡片 - 严格按照ArticleCard的设计风格 */
    .draft-row {
        background-color: #ffffff; /* 纯白背景，与页面灰色背景形成对比 */
        border-radius: var(--border-radius-md); /* 8px圆角 */
        padding: 1.5rem;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        /* 与ArticleCard完全相同的阴影系统 */
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        /* 与ArticleCard完全相同的过渡效果 */
        transition:
            transform var(--transition-speed) ease-in-out,
            box-shadow var(--transition-speed) ease-in-out;
    }

    /* 悬停效果 - 与ArticleCard完全一致的上浮动效 */
    .draft-row:hover {
        transform: translateY(-4px); /* 与ArticleCard相同的上浮距离 */
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.06); /* 与ArticleCard相同的悬停阴影 */
    }

    /* 草稿卡片包装器 */
    .draft-card-wrapper {
        position: relative;
        flex: 1;
    }

    /* 草稿内容样式 - 直接替代ArticleCard */
    .draft-content {
        padding: 1.5rem 2rem;
        width: 100%;
        box-sizing: border-box;
    }

    .draft-content h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        line-height: 1.4;
        min-height: calc(2 * 1.4em);
        max-height: calc(2 * 1.4em);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title-link {
        color: var(--text-primary);
        background: none;
        border: none;
        padding: 0;
        text-align: left;
        font-size: inherit;
        font-weight: inherit;
        font-family: inherit;
        cursor: pointer;
        transition: color var(--transition-speed) ease;
        width: 100%;
        display: block;
    }

    .title-link:hover {
        color: var(--text-secondary);
        text-decoration: underline;
        text-decoration-thickness: 2px;
    }

    .draft-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .draft-meta span {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .author-link {
        color: var(--text-secondary);
        background: none;
        border: none;
        padding: 0;
        font-size: inherit;
        font-family: inherit;
        cursor: pointer;
        transition: color var(--transition-speed) ease;
        text-decoration: none;
    }

    .author-link:hover {
        color: var(--text-primary);
        text-decoration: underline;
    }

    .draft-summary {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 1rem;
    }

    .draft-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--background);
        color: var(--text-secondary);
        border-radius: var(--border-radius-sm);
        font-size: 0.8rem;
        font-weight: 500;
        border: 1px solid var(--border-color);
        transition: 
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }

    .tag:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }

    /* 草稿标记 - 纯黑白灰设计，移除彩色元素 */
    .draft-badge {
        position: absolute;
        top: -0.75rem;
        right: -0.75rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        /* 改为黑白灰配色 */
        background-color: var(--text-primary); /* #212121 黑色背景 */
        color: #ffffff; /* 白色文字 */
        border: 2px solid #ffffff; /* 白色边框 */
        border-radius: var(--border-radius-md);
        font-size: 0.8rem;
        font-weight: 600;
        /* 黑白灰阴影 */
        box-shadow: 0 2px 8px rgba(33, 33, 33, 0.3);
        z-index: 10;
    }

    .draft-badge svg {
        width: 1rem;
        height: 1rem;
    }

    /* 操作按钮组 - 与主站导航按钮风格一致 */
    .draft-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color); /* #e0e0e0 */
    }

    .draft-actions button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color); /* #e0e0e0 */
        border-radius: var(--border-radius-md);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        background-color: #ffffff;
        /* 与ArticleCard完全一致的过渡效果 */
        transition:
            transform var(--transition-speed) ease-in-out,
            box-shadow var(--transition-speed) ease-in-out,
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
    }

    .draft-actions button svg {
        width: 1.125rem;
        height: 1.125rem;
    }

    /* 编辑按钮 - 统一风格，与其他按钮保持一致 */
    .edit-btn {
        background-color: #ffffff;
        color: var(--text-secondary); /* #757575 */
        border-color: var(--text-secondary);
    }

    .edit-btn:hover {
        transform: translateY(-4px); /* 与ArticleCard相同的上浮距离 */
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.06); /* 与ArticleCard相同的悬停阴影 */
    }

    /* 发布按钮 - 次要操作，黑白灰风格 */
    .publish-btn {
        background-color: #ffffff;
        color: var(--text-secondary); /* #757575 */
        border-color: var(--text-secondary);
    }

    .publish-btn:hover {
        transform: translateY(-4px); /* 与ArticleCard相同的上浮距离 */
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.06); /* 与ArticleCard相同的悬停阴影 */
    }

    /* 删除按钮 - 危险操作，但保持黑白灰风格 */
    .delete-btn {
        background-color: #ffffff;
        color: var(--text-secondary); /* #757575 */
        border-color: var(--text-secondary);
    }

    .delete-btn:hover {
        transform: translateY(-4px); /* 与ArticleCard相同的上浮距离 */
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.06); /* 与ArticleCard相同的悬停阴影 */
    }

    /* 空状态样式 - 与主站卡片设计完全一致 */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background-color: #ffffff;
        border: 1px dashed var(--border-color); /* #e0e0e0 */
        border-radius: var(--border-radius-md);
        /* 与其他卡片相同的阴影 */
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .empty-icon {
        margin: 0 auto 2rem;
        padding: 1.5rem;
        background-color: var(--background); /* #f5f5f5 */
        border-radius: 50%;
        color: var(--text-secondary); /* #757575 */
        width: fit-content;
    }

    .empty-icon svg {
        width: 3rem;
        height: 3rem;
    }

    .empty-state h3 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary); /* #212121 */
    }

    .empty-state p {
        margin: 0 0 2.5rem 0;
        color: var(--text-secondary); /* #757575 */
        font-size: 1.1rem;
        line-height: 1.6;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }

    /* 新建文章按钮 - 与主站register-btn风格完全一致 */
    .new-article-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background-color: var(--text-primary); /* #212121 */
        color: #ffffff;
        border: none;
        border-radius: var(--border-radius-md);
        font-size: 1.1rem;
        font-weight: 500;
        cursor: pointer;
        /* 与主站按钮相同的过渡效果 */
        transition:
            background-color var(--transition-speed) ease,
            transform var(--transition-speed) ease;
    }

    .new-article-btn:hover {
        background-color: #424242; /* 与主站register-btn悬停色一致 */
        transform: translateY(-2px);
    }

    .new-article-btn svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* 响应式设计 - 与主站完全一致的断点和调整 */
    @media (max-width: 768px) {
        .page-header h1 {
            font-size: 2rem;
        }

        .drafts-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .draft-row {
            padding: 1.25rem;
        }

        .draft-actions {
            flex-direction: column;
            gap: 0.5rem;
        }

        .draft-actions button {
            flex: none;
            padding: 0.875rem;
        }

        .draft-badge {
            top: -0.5rem;
            right: -0.5rem;
            padding: 0.375rem 0.625rem;
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .page-header h1 {
            font-size: 1.75rem;
        }

        .empty-state {
            padding: 3rem 1.5rem;
        }

        .empty-state h3 {
            font-size: 1.25rem;
        }

        .empty-state p {
            font-size: 1rem;
        }

        .new-article-btn {
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
        }
    }
</style>
