<script lang="ts">
    import type { MessageClient } from "$lib/types/client/messageClient";
    export let data: { messages: MessageClient[] };

    // 标记单条消息为已读
    async function markAsRead(id: string) {
        // 提示: 在一个真实的应用中，这里会局部更新状态而不是整页刷新
        // 以提供更流畅的用户体验。
        await fetch("/api/message", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: id }),
        });
        location.reload();
    }

    // 批量标记为已读
    async function markAllAsRead() {
        await fetch("/api/message", { method: "PUT" });
        location.reload();
    }
</script>

<div class="message-center-container">
    <div class="header">
        <h1>我的消息</h1>
        {#if data.messages.some((m) => !m.isRead)}
            <button class="btn btn-secondary" on:click={markAllAsRead}
                >全部标为已读</button
            >
        {/if}
    </div>

    {#if data.messages.length === 0}
        <div class="empty-state">
            <p>这里空空如也，暂无新消息。</p>
        </div>
    {:else}
        <ul class="message-list">
            {#each data.messages as msg}
                <li class="message-item" class:unread={!msg.isRead}>
                    <div class="message-icon">
                        {#if msg.type === "like"}
                            <span aria-label="赞">👍</span>
                        {:else if msg.type === "comment"}
                            <span aria-label="评论">💬</span>
                        {/if}
                    </div>

                    <div class="message-content">
                        <p class="main-text">
                            <b>{msg.fromUserName}</b>
                            {#if msg.type === "like"}
                                赞了你的文章
                            {:else if msg.type === "comment"}
                                评论了你的文章
                            {/if}
                            <a href="/articles/{msg.articleId}"
                                >《{msg.articleTitle}》</a
                            >
                        </p>
                        {#if msg.type === "comment" && msg.commentContent}
                            <blockquote class="comment-quote">
                                {msg.commentContent}
                            </blockquote>
                        {/if}
                    </div>

                    <div class="message-meta">
                        <small class="timestamp"
                            >{new Date(msg.createdAt).toLocaleString()}</small
                        >
                        {#if !msg.isRead}
                            <button
                                class="btn btn-text"
                                on:click={() => markAsRead(msg._id)}
                                >标为已读</button
                            >
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    /* 
        设计理念:
        - 遵循之前组件的布局和标题样式，保持一致性。
        - 消息列表是信息的核心，每一条消息都应被视为一个独立的、清晰的单元。
      */
    .message-center-container {
        max-width: 900px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    h1 {
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    /* 
        设计理念: 按钮层级
        - "全部标为已读" 是一个次要操作，使用中性、柔和的按钮样式。
        - "标为已读" 是单项操作，使用更轻量的纯文本按钮。
        - 这体现了操作重要性的视觉区分。
      */
    .btn {
        padding: 0.6rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #fff;
        color: var(--text-primary);
        font-weight: 500;
        cursor: pointer;
        transition:
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }

    .btn.btn-secondary:hover {
        background-color: var(--hover-bg);
    }

    .btn.btn-text {
        border: none;
        background: none;
        color: var(--text-secondary);
        padding: 0.5rem;
    }

    .btn.btn-text:hover {
        color: var(--text-primary);
        background-color: var(--hover-bg);
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--text-secondary);
        background-color: #fff;
        border-radius: var(--border-radius-md);
        border: 1px dashed var(--border-color);
    }

    /* 
        设计理念: 消息列表
        - 使用 `ul` 但去除默认样式，将其作为布局容器。
        - `gap` 属性提供了清晰、一致的间距。
      */
    .message-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* 
        设计理念: 消息项作为“材质”
        - 每个 `li` 是一个独立的“材质卡片”，有自己的背景和边框，与其他内容分离。
        - Flexbox 布局提供了灵活、强大的对齐能力。
        - hover 效果提供了微妙的交互反馈。
      */
    .message-item {
        display: flex;
        align-items: flex-start; /* 顶部对齐，以应对多行内容 */
        gap: 1.25rem;
        padding: 1rem 1.5rem;
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        transition: background-color var(--transition-speed) ease;
    }

    .message-item:hover {
        background-color: color-mix(in srgb, var(--background) 50%, white);
    }

    /* 
        设计理念: 未读状态的视觉提示
        - 使用柔和的背景色变化来表示未读，而不是刺眼的颜色。
        - 左侧边框的强调色是一个更微妙且优雅的指示器，符合“克制的视觉语言”。
      */
    .message-item.unread {
        background-color: color-mix(in srgb, var(--highlight-color) 3%, white);
        border-left: 3px solid var(--highlight-color);
        font-weight: 500; /* 未读消息内容稍加粗 */
    }

    .message-icon {
        font-size: 1.5rem;
        margin-top: -0.25rem; /* 微调图标位置，使其与文本视觉对齐 */
    }

    .message-content {
        flex-grow: 1; /* 占据尽可能多的空间 */
    }

    .main-text {
        margin: 0;
        line-height: 1.6;
    }

    .main-text b {
        color: var(--text-primary);
        font-weight: 600;
    }

    .main-text a {
        color: var(--text-primary);
        text-decoration: none;
        font-weight: 500;
    }
    .main-text a:hover {
        text-decoration: underline;
    }

    /* 
        设计理念: 引用块的人文关怀
        - 评论内容是引用，使用 `blockquote` 样式，有清晰的视觉分隔。
        - 颜色和斜体使其在视觉上退后一步，作为附属信息。
      */
    .comment-quote {
        margin: 0.75rem 0 0 0;
        padding-left: 1rem;
        border-left: 3px solid var(--border-color);
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-style: italic;
        line-height: 1.6;
    }

    /* 
        设计理念: 元信息(Meta)的对齐与层级
        - 将时间戳和操作按钮组合在一起，并推到最右侧，与内容主体分离。
        - `text-align: right` 保证了即使按钮消失，时间戳依然靠右。
      */
    .message-meta {
        margin-left: auto;
        padding-left: 1rem;
        flex-shrink: 0;
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .timestamp {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap; /* 防止时间换行 */
    }
</style>
