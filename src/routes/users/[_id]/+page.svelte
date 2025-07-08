<!-- +page.svelte (优化后) -->
<script>
    import ArticleCard from "$lib/components/ArticleCard.svelte";
    let { data } = $props();
    let articles = $derived(data.articles);
    let user = $derived(data.user);
</script>

<div class="user-profile">
    <h2>用户信息</h2>
    {#if user}
        <div class="profile-field"><span class="label">用户名：</span>{user.name}</div>
        <div class="profile-field"><span class="label">邮箱：</span>{user.email}</div>
        <div class="profile-field"><span class="label">个性签名：</span>{user.signature || '（无）'}</div>
    {:else}
        <div>未找到用户信息</div>
    {/if}
</div>

<h2>用户文章列表</h2>

{#if articles && articles.length > 0}
    {#each articles as article}
        <ArticleCard {article} />
    {/each}
{:else}
    <p>暂无文章可显示</p>
{/if}

<style>
.user-profile {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--surface-bg, #f8f8f8);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.profile-field {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
}
.label {
    color: var(--text-secondary, #888);
    font-weight: 600;
    margin-right: 0.5em;
}
</style>
