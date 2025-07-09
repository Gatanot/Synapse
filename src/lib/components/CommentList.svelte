<!-- src/lib/components/CommentList.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import type { CommentClient } from "$lib/types/client";

    // Props
    let {
        articleId,
        initialLoad = true,
    }: {
        articleId: string;
        initialLoad?: boolean;
    } = $props();

    // 状态管理
    let comments: CommentClient[] = $state([]);
    let loading = $state(false);
    let error = $state("");
    let hasLoaded = $state(false); 

    // 获取评论列表
    async function fetchComments() {
        if (loading) return;
        loading = true;
        error = "";

        try {
            const response = await fetch(`/api/comments?articleId=${articleId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.success) {
                comments = (data.comments || []).map((comment: any) => ({
                    ...comment,
                    createdAt: new Date(comment.createdAt),
                }));
                hasLoaded = true;
            } else {
                error = data.message || "获取评论失败";
            }
        } catch (err) {
            console.error("获取评论失败:", err);
            error = "无法加载评论，请稍后重试";
        } finally {
            loading = false;
        }
    }

    // 格式化时间
    function formatDate(date: Date): string {
        return new Date(date).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    onMount(() => {
        if (initialLoad && articleId) {
            fetchComments();
        }
    });

    export function refreshComments() { fetchComments(); }
    export function loadComments() { if (!hasLoaded) fetchComments(); }

    $effect(() => {
        if (articleId) {
            comments = [];
            error = "";
            hasLoaded = false;
            loading = false;
        }
    });
</script>

<section class="comment-section">
    <header class="section-header">
        <h3>评论 ({comments.length})</h3>
        <!-- 设计理念: 对刷新这类次要操作，使用简洁的图标按钮，减少视觉噪音 -->
        <button
            class="icon-btn"
            onclick={fetchComments}
            disabled={loading}
            title="刷新评论"
            aria-label="刷新评论"
        >
            {#if loading}
                <span class="spinner"></span>
            {:else}
                <!-- 使用 SVG 替代 Emoji，确保跨平台显示一致性和样式可控性 -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>
                </svg>
            {/if}
        </button>
    </header>

    <div class="content-area">
        {#if loading && comments.length === 0}
            <div class="status-placeholder">
                <span class="spinner large"></span>
                <p>正在加载评论...</p>
            </div>
        {:else if error}
            <div class="status-placeholder">
                <span class="placeholder-icon">⚠️</span>
                <p>{error}</p>
                <button class="retry-btn" onclick={fetchComments}>重试</button>
            </div>
        {:else if comments.length === 0 && hasLoaded}
            <div class="status-placeholder">
                <p>暂无评论</p>
            </div>
        {:else if comments.length > 0}
            <div class="comments-container">
                {#each comments as comment (comment._id)}
                    <article class="comment-item">
                        <header class="comment-item-header">
                            <span class="author-name">{comment.authorName}</span>
                            <time class="comment-time" datetime={comment.createdAt.toISOString()}>
                                {formatDate(comment.createdAt)}
                            </time>
                        </header>
                        <div class="comment-content">
                            {comment.content}
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</section>

<style>
    /* 
      设计理念: 将评论区作为一个完整的内容版块
    */
    .comment-section {
        margin-top: 3rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .section-header h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    /* 
      设计理念: 新的UI模式 - 图标按钮
      - 用于不需文字说明的、重复性的次要操作（如刷新）。
      - 简洁、占用空间小，符合极简主义。
    */
    .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem; /* 40px */
        height: 2.25rem;
        border: none;
        background: transparent;
        border-radius: 50%;
        color: var(--text-secondary);
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }
    .icon-btn:hover:not(:disabled) {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }
    .icon-btn:disabled .spinner {
        border-top-color: var(--text-primary);
    }
    .icon-btn svg {
        width: 1.5rem;
        height: 1.5rem;
    }

    /* 
      设计理念: 统一的状态占位符
      - 为加载、错误、空状态提供一个统一的、友好的视觉容器。
      - 与首页的空状态风格一致，使用柔和的视觉元素引导用户。
    */
    .status-placeholder {
        text-align: center;
        padding: 3rem 2rem;
        background-color: #fcfcfc;
        border: 1px dashed var(--border-color);
        border-radius: var(--border-radius-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }
    .status-placeholder p {
        margin: 0;
        font-size: 1rem;
        color: var(--text-secondary);
    }
    .placeholder-icon {
        font-size: 2.5rem;
        line-height: 1;
        color: var(--text-secondary);
        opacity: 0.5;
    }
    
    /* 
      设计理念: 一致的按钮样式
      - 重试按钮是一个纠错操作，使用我们已定义的次要按钮样式（边框+文字）。
    */
    .retry-btn {
        /* 复用 dashboard 的 .action-btn 样式 */
        padding: 0.5rem 1.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: transparent;
        color: var(--text-primary);
        font-weight: 500;
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
    }
    .retry-btn:hover {
        background-color: var(--hover-bg);
        border-color: var(--highlight-color);
    }

    /* 
      设计理念: 内容优先
      - 评论列表本身不需要过多的装饰。
      - 使用清晰的分割线和良好的排版，让内容本身成为主角。
    */
    .comment-item {
        padding: 1.5rem 0;
        border-bottom: 1px solid var(--border-color);
    }
    .comment-item:last-child {
        border-bottom: none;
    }
    .comment-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .author-name {
        font-weight: 500;
        color: var(--text-primary);
    }
    .comment-time {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    .comment-content {
        line-height: 1.7;
        color: var(--text-primary);
        /* 允许长单词或链接换行，防止破坏布局 */
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    /* 复用 spinner 样式 */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
        display: inline-block;
        width: 1em;
        height: 1em;
        border-radius: 50%;
        border: 2px solid var(--text-secondary);
        border-top-color: transparent;
        animation: spin 0.8s linear infinite;
    }
    .spinner.large {
        width: 2rem;
        height: 2rem;
        border-width: 3px;
    }
</style>