<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import ArticleCard from '$lib/components/ArticleCard.svelte';

    // 从服务端加载的数据
    let { data } = $props();
    
    // 使用 $derived 替换 $: 响应式语句
    let searchResults = $derived(data.articles || []);
    let hasSearched = $derived(data.hasSearched || false);
    let errorMessage = $derived(data.error || '');
</script>

<svelte:head>
    <title>搜索文章 - Synapse</title>
    <meta name="description" content="搜索Synapse平台上的文章内容" />
</svelte:head>

<div class="search-page">
    <div class="search-container">
        <h1>搜索结果</h1>
        
        <!-- 错误信息 -->
        {#if errorMessage}
            <div class="error-message">
                {errorMessage}
            </div>
        {/if}

        <!-- 搜索结果 -->
        {#if hasSearched}
            <div class="search-results">
                {#if searchResults.length > 0}
                    <div class="results-header">
                        <h2>搜索结果</h2>
                        <p class="results-count">
                            找到 {searchResults.length} 篇相关文章
                            {#if data.searchTerm}
                                - 关键词: "<span class="search-term">{data.searchTerm}</span>"
                            {/if}
                        </p>
                    </div>
                    
                    <div class="articles-grid">
                        {#each searchResults as article (article._id)}
                            <ArticleCard {article} />
                        {/each}
                    </div>
                {:else}
                    <div class="no-results">
                        <h2>未找到相关文章</h2>
                        <p>
                            没有找到包含关键词 "<span class="search-term">{data.searchTerm}</span>" 的文章。
                        </p>
                        <p class="search-tips">
                            搜索建议：
                        </p>
                        <ul class="tips-list">
                            <li>检查关键词拼写是否正确</li>
                            <li>尝试使用更简短的关键词</li>
                            <li>尝试搜索文章标题、标签或作者名</li>
                            <li>使用不同的相关词汇</li>
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- 初始状态提示 -->
        {#if !hasSearched}
            <div class="search-tips-initial">
                <h2>开始搜索</h2>
                <p>在上方输入关键词来搜索文章。你可以搜索：</p>
                <ul>
                    <li><strong>文章标题</strong> - 搜索文章标题中的关键词</li>
                    <li><strong>标签</strong> - 搜索文章的标签</li>
                    <li><strong>作者名</strong> - 搜索作者的用户名</li>
                </ul>
            </div>
        {/if}
    </div>
</div>

<style>
    .search-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .search-container h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    .error-message {
        background-color: #fee;
        color: #c33;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #fcc;
        margin-bottom: 1rem;
    }

    .results-header {
        margin-bottom: 1.5rem;
    }

    .results-header h2 {
        color: #333;
        margin-bottom: 0.5rem;
    }

    .results-count {
        color: #666;
        margin: 0;
    }

    .search-term {
        font-weight: bold;
        color: #0066cc;
    }

    .articles-grid {
        display: grid;
        gap: 1.5rem;
    }

    .no-results {
        text-align: center;
        padding: 2rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .no-results h2 {
        color: #666;
        margin-bottom: 1rem;
    }

    .no-results p {
        color: #888;
        margin-bottom: 1rem;
    }

    .search-tips {
        font-weight: bold;
        color: #555;
        margin-bottom: 0.5rem;
    }

    .tips-list {
        text-align: left;
        display: inline-block;
        color: #666;
    }

    .tips-list li {
        margin-bottom: 0.25rem;
    }

    .search-tips-initial {
        background-color: #f0f8ff;
        padding: 2rem;
        border-radius: 8px;
        border: 1px solid #e1e8f0;
    }

    .search-tips-initial h2 {
        color: #0066cc;
        margin-bottom: 1rem;
    }

    .search-tips-initial p {
        color: #555;
        margin-bottom: 1rem;
    }

    .search-tips-initial ul {
        color: #666;
    }

    .search-tips-initial li {
        margin-bottom: 0.5rem;
    }

    /* 响应式设计 */
    @media (max-width: 640px) {
        .search-page {
            padding: 1rem 0.5rem;
        }
    }
</style>
