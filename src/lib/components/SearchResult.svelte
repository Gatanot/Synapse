<script>
    let { article } = $props();
</script>

<div class="search-result">
    <h2 class="result-title">
        <a href="/articles/{article._id}">{article.title}</a>
    </h2>
    <div class="result-meta">
        <span class="author">
            <a href="/users/{article.authorId}">{article.authorName}</a>
        </span>
        <span class="date">
            {new Date(article.createdAt).toLocaleDateString()}
        </span>
        <span class="likes">赞同{article.likes ?? 0}</span>
    </div>
    <p class="result-summary">
        {article.summary}
    </p>
    {#if article.tags && article.tags.length > 0}
        <div class="result-tags">
            {#each article.tags as tag (tag)}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* 
      设计理念: 搜索结果组件
      - 与 ArticleCard 保持一致的风格和视觉语言
      - 宽度占满容器宽度，高度自适应内容
      - 使用底部边框作为分隔，更适合列表展示
      - 保持良好的可读性和交互性
    */
    .search-result {
        width: 100%;
        padding: 1.5rem 0;
        margin-bottom: 0;
        border-bottom: 1px solid var(--border-color);
        transition: all var(--transition-speed) ease;
    }

    .search-result:hover {
        background-color: var(--hover-bg);
        padding-left: 1rem;
        padding-right: 1rem;
        margin-left: -1rem;
        margin-right: -1rem;
        border-radius: var(--border-radius-md);
        border-bottom: 1px solid transparent;
    }

    .search-result:last-child {
        border-bottom: none;
    }

    /* 
      设计理念: 标题设计
      - 与 ArticleCard 保持一致的标题样式
      - 支持多行显示，最多3行以适应搜索结果
      - 保持清晰的视觉层级
    */
    .result-title {
        margin: 0 0 0.75rem 0;
        font-size: 1.4rem;
        line-height: 1.4;
        max-height: calc(3 * 1.4em); /* 最多3行 */
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .result-title a {
        color: var(--text-primary);
        text-decoration: none;
        transition: color var(--transition-speed) ease;
    }

    .result-title a:hover {
        color: var(--highlight-color);
        text-decoration: underline;
        text-decoration-thickness: 2px;
    }

    /* 
      设计理念: 元信息
      - 与 ArticleCard 保持一致的元信息样式
      - 使用 flex 布局和适当的间距
      - 保持良好的视觉层级
    */
    .result-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
    }

    .result-meta a {
        color: inherit;
        text-decoration: none;
        transition: color var(--transition-speed) ease;
    }

    .result-meta a:hover {
        color: var(--text-primary);
        text-decoration: underline;
    }

    /* 日期前的分隔符 */
    .result-meta .date::before {
        content: "·";
        margin-right: 1.5rem;
        font-weight: bold;
    }

    /* 赞同数前的分隔符 */
    .result-meta .likes::before {
        content: "·";
        margin-right: 1.5rem;
        font-weight: bold;
    }

    /* 
      设计理念: 摘要内容
      - 与 ArticleCard 保持一致的可读性设计
      - 允许更多行显示以提供更多上下文
      - 保持良好的行高和颜色对比
    */
    .result-summary {
        margin: 0 0 1rem 0;
        line-height: 1.6;
        color: var(--text-primary);
        font-size: 0.95rem;
        /* 搜索结果摘要允许更多行显示 */
        max-height: calc(4 * 1.6em); /* 最多4行 */
        display: -webkit-box;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 
      设计理念: 标签设计
      - 与 ArticleCard 保持一致的标签样式
      - 适应搜索结果的布局需求
      - 保持良好的视觉效果
    */
    .result-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .tag {
        display: inline-block;
        background-color: var(--background);
        color: var(--text-secondary);
        padding: 0.25rem 0.75rem;
        border-radius: var(--border-radius-md);
        font-size: 0.8rem;
        font-weight: 500;
        transition: all var(--transition-speed) ease;
    }

    .tag:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }

    /* 响应式设计 */
    @media (max-width: 640px) {
        .search-result {
            padding: 1rem 0;
        }

        .result-title {
            font-size: 1.2rem;
        }

        .result-meta {
            gap: 0.25rem 1rem;
            font-size: 0.8rem;
        }

        .result-summary {
            font-size: 0.9rem;
            max-height: calc(3 * 1.6em); /* 移动端最多3行 */
            -webkit-line-clamp: 3;
            line-clamp: 3;
        }

        .result-tags {
            gap: 0.25rem;
        }

        .tag {
            font-size: 0.75rem;
            padding: 0.2rem 0.6rem;
        }
    }
</style>
