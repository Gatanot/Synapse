<script>
    let { article } = $props();
</script>

<div class="article-card">
    <h2><a href="/articles/{article._id}">{article.title}</a></h2>
    <div class="article-card-meta">
        <span class="author">作者: {article.authorName}</span>
        <span class="date">创建日期: {article.createdAt}</span>
    </div>
    <p class="article-card-summary">
        {article.summary}
    </p>
    {#if article.tags && article.tags.length > 0}
        <div class="article-card-tags">
            标签:
            {#each article.tags as tag (tag)}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}
</div>
