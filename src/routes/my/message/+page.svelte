<script lang="ts">
  import type { MessageClient } from '$lib/types/client/messageClient';
  export let data: { messages: MessageClient[] };

  // 标记单条消息为已读
  async function markAsRead(id: string) {
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
</script>

<h1>我的消息</h1>
<button on:click={markAllAsRead}>全部标为已读</button>
{#if data.messages.length === 0}
  <p>暂无消息</p>
{:else}
  <ul>
    {#each data.messages as msg}
      <li class:unread={!msg.isRead}>
        <div>
          {#if msg.type === 'like'}
            <span>👍 <b>{msg.fromUserName}</b> 赞了你的文章《{msg.articleTitle}》</span>
          {:else if msg.type === 'comment'}
            <span>💬 <b>{msg.fromUserName}</b> 评论了你的文章《{msg.articleTitle}》：</span>
            <blockquote>{msg.commentContent}</blockquote>
          {/if}
        </div>
        <small>{new Date(msg.createdAt).toLocaleString()}</small>
        {#if !msg.isRead}
          <button on:click={() => markAsRead(msg._id)}>标为已读</button>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
.unread {
  background: #f5faff;
  font-weight: bold;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 1em;
  border-bottom: 1px solid #eee;
  padding: 1em 0;
}
blockquote {
  margin: 0.5em 0 0 1em;
  color: #555;
  background: #f9f9f9;
  border-left: 3px solid #b3d4fc;
  padding: 0.5em 1em;
}
button {
  margin-left: 1em;
}
</style>
