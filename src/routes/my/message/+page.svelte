<script lang="ts">
  import type { MessageClient } from '$lib/types/client/messageClient';
  export let data: { messages: MessageClient[] };

  // 标记单条消息为已读
  async function markAsRead(id: string) {
    // 提示: 在一个真实的应用中，这里会局部更新状态而不是整页刷新
    // 以提供更流畅的用户体验。
    await fetch('/api/message', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: id })
    });
    location.reload();
  }

  // 批量标记为已读
  async function markAllAsRead() {
    await fetch('/api/message', { method: 'PUT' });
    location.reload();
  }

  // 清空已读消息
  async function deleteAllReadMessages() {
    await fetch('/api/message', { method: 'DELETE' });
    location.reload();
  }
</script>

<div class="message-center-container">
    <div class="header">
        <h1>我的消息</h1>
        <div>
            {#if data.messages.some(m => !m.isRead)}
                <button class="btn btn-secondary" on:click={markAllAsRead}>全部标为已读</button>
            {/if}
            {#if data.messages.some(m => m.isRead)}
                <button class="btn btn-danger" on:click={deleteAllReadMessages} style="margin-left: 1em;">清空已读消息</button>
            {/if}
        </div>
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
                        {#if msg.type === 'like'}
                            <span aria-label="赞">👍</span>
                        {:else if msg.type === 'comment'}
                            <span aria-label="评论">💬</span>
                        {/if}
                    </div>

                    <div class="message-content">
                        <p class="main-text">
                            <b>{msg.fromUserName}</b>
                            {#if msg.type === 'like'}
                                赞了你的文章
                            {:else if msg.type === 'comment'}
                                评论了你的文章
                            {/if}
                            <a href="/articles/{msg.articleId}">《{msg.articleTitle}》</a>
                        </p>
                        {#if msg.type === 'comment' && msg.commentContent}
                            <blockquote class="comment-quote">{msg.commentContent}</blockquote>
                        {/if}
                    </div>
                    
                    <div class="message-meta">
                        <small class="timestamp">{new Date(msg.createdAt).toLocaleString()}</small>
                        {#if !msg.isRead}
                            <button class="btn btn-text" on:click={() => markAsRead(msg._id)}>标为已读</button>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
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
    .btn.btn-danger {
        border: 1px solid #e57373;
        color: #e57373;
        background: #fff0f0;
    }
    .btn.btn-danger:hover {
        background: #ffeaea;
        color: #b71c1c;
        border-color: #b71c1c;
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
    .message-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .message-item {
        display: flex;
        align-items: flex-start;
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
    .message-item.unread {
        background-color: color-mix(in srgb, var(--highlight-color) 3%, white);
        border-left: 3px solid var(--highlight-color);
        font-weight: 500;
    }
    .message-icon {
        font-size: 1.5rem;
        margin-top: -0.25rem;
    }
    .message-content {
        flex-grow: 1;
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
    .comment-quote {
        margin: 0.75rem 0 0 0;
        padding-left: 1rem;
        border-left: 3px solid var(--border-color);
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-style: italic;
        line-height: 1.6;
    }
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
        white-space: nowrap;
    }
</style>