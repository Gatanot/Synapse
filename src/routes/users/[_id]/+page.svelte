<!-- +page.svelte (优化后) -->
<script>
    import ArticleCard from "$lib/components/ArticleCard.svelte";
    let { data } = $props();
    let articles = $derived(data.articles);
</script>

<h1>用户文章列表</h1>

{#if articles && articles.length > 0}
    {#each articles as article}
        <ArticleCard {article} />
    {/each}
{:else}
    <p>暂无文章可显示</p>
{/if}
