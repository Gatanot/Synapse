<!--
    SearchResult.svelte - 搜索结果项组件
    
    @component
    @description 展示单个搜索结果的组件，包含文章标题、作者、时间、摘要和标签
    
    @prop {Object} article - 文章对象
    @prop {string} article._id - 文章ID
    @prop {string} article.title - 文章标题
    @prop {string} article.authorId - 作者ID
    @prop {string} article.authorName - 作者姓名
    @prop {Date} article.createdAt - 创建时间
    @prop {string} article.summary - 文章摘要
    @prop {number} article.likes - 点赞数
    @prop {string[]} article.tags - 文章标签数组
    
    @example
    <SearchResult {article} />
-->
<script lang="ts">
    import Modal from './Modal.svelte';
    import { userDeletedModal } from '$lib/stores/userModal';
    let { article } = $props();
   
    /**
     * 处理作者点击事件
     * @description 检查用户是否存在，存在则跳转到用户页面，不存在则显示用户已注销弹窗
     * @param {MouseEvent} event - 鼠标点击事件
     */
    async function handleAuthorClick(event: MouseEvent) {
        event.preventDefault();
        const userId = article.authorId;
        console.log('点击用户名，userId:', userId);
        if (!userId) {
            userDeletedModal.set(true);
            return;
        }
        try {
            const res = await fetch(`/api/users/${userId}/exists`);
            const data = await res.json();
            console.log('后端 exists 接口返回:', data);
            if (data.exists) {
                console.log('用户存在，跳转');
                window.location.href = `/users/${userId}`;
            } else {
                userDeletedModal.set(true);
                console.log('用户不存在，弹窗', $userDeletedModal);
            }
        } catch (e) {
            console.log('请求出错，弹窗', e);
            userDeletedModal.set(true);
        }
    }
    /**
     * 关闭用户已注销提示弹窗
     */
    function closeModal() {
        userDeletedModal.set(false);
    }
</script>

<div class="search-result">
    <h2 class="result-title">
        <a href="/articles/{article._id}">{article.title}</a>
    </h2>
    <div class="result-meta">
        <span class="author">
            <a href="/users/{article.authorId}" on:click={handleAuthorClick}>
                {article.authorName ? article.authorName : '已注销用户'}
            </a>
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
    {#if $userDeletedModal}
        <Modal
            title="用户已注销"
            content="该用户已被注销，相关信息不可用。"
            confirmText="确定"
            on:confirm={closeModal}
            on:cancel={closeModal}
        />
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
