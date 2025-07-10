<!--
    ArticleCard.svelte - 文章卡片组件
    
    @component
    @description 展示文章信息的卡片组件，包含标题、作者、创建时间、摘要和标签
    
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
    <ArticleCard {article} />
-->
<script lang="ts">
    import Modal from './Modal.svelte';
    import { userDeletedModal } from '$lib/stores/userModal';
    let { article } = $props();
    
    // 标签滑动功能的状态管理
    let tagsContainer = $state<HTMLDivElement>();
    let scrollPosition = $state(0);
    let isHovering = $state(false);

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
            console.log('userId 为空，弹窗');
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
                console.log('用户不存在，弹窗');
                userDeletedModal.set(true);
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
    
    /**
     * 处理标签区域的鼠标滚轮事件
     * @description 允许用户通过滚轮水平滚动标签列表
     * @param {WheelEvent} event - 鼠标滚轮事件
     */
    function handleWheel(event: WheelEvent) {
        if (!tagsContainer || !isHovering) return;
        
        event.preventDefault();
        
        const container = tagsContainer;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // 滚轮向上滚动时向左移动标签（显示更多标签）
        const scrollDelta = event.deltaY > 0 ? -30 : 30;
        scrollPosition = Math.max(0, Math.min(maxScroll, scrollPosition + scrollDelta));
        
        container.scrollLeft = scrollPosition;
    }
    
    /**
     * 鼠标进入标签区域时启用滚轮滚动
     */
    function handleMouseEnter() {
        isHovering = true;
    }
    
    /**
     * 鼠标离开标签区域时禁用滚轮滚动
     */
    function handleMouseLeave() {
        isHovering = false;
    }
</script>

<div class="article-card">
    <h2><a href="/articles/{article._id}">{article.title}</a></h2>
    <div class="article-card-meta">
        <span class="author">
            <a href="/users/{article.authorId}" onclick={handleAuthorClick}>
                {article.authorName ? article.authorName : '已注销用户'}
            </a>
        </span>
        <span class="date"
            >{new Date(article.createdAt).toLocaleDateString()}</span
        >
        <span class="likes">赞同{article.likes ?? 0}</span>
    </div>
    <p class="article-card-summary">
        {article.summary.length > 30
            ? article.summary.slice(0, 30) + "..."
            : article.summary}
    </p>
    {#if article.tags && article.tags.length > 0}
        <div 
            class="article-card-tags"
            bind:this={tagsContainer}
            onwheel={handleWheel}
            onmouseenter={handleMouseEnter}
            onmouseleave={handleMouseLeave}
            role="group"
            aria-label="文章标签列表"
        >
            {#each article.tags as tag (tag)}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    {/if}
   
</div>

<style>
    /* 
      设计理念:
      - `.article-card` 是内容的主要“材质卡片”，是信息的承载体。
      - 它遵循了全局指南中的 “使用 box-shadow 创造深度” 原则。
      - 交互反馈：当鼠标悬停时，卡片会轻微“上浮”并增强阴影，提供清晰、有意义的动效，
        暗示这是一个可以整体交互的单元。这比改变背景色更微妙、更优雅。
    */
    .article-card {
        background-color: #ffffff; /* 卡片使用纯白背景，与浅灰页面背景形成对比 */
        border-radius: var(--border-radius-md);
        padding: 1.5rem 2rem;
        margin-bottom: 2rem;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        transition:
            transform var(--transition-speed) ease-in-out,
            box-shadow var(--transition-speed) ease-in-out;
        /* 宽度限制：确保卡片宽度一致，与外部网格布局配合 */
        width: 100%;
        max-width: 300px; /* 最大宽度限制，略大于网格最小宽度 */
        min-width: 300px; /* 最小宽度限制，与网格最小宽度保持一致 */
        box-sizing: border-box; /* 确保padding包含在宽度内 */
    }

    .article-card:hover {
        transform: translateY(-4px); /* 悬停时轻微上浮 */
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 8px 24px rgba(0, 0, 0, 0.06); /* 阴影更深，增强立体感 */
    }

    /* 
      设计理念: 标题是卡片的核心
      - 标题链接是主要交互点，使用主文本颜色。
      - 遵循 “克制的视觉语言” 原则，默认无下划线，仅在悬停时显示，保持界面整洁。
    */
    .article-card h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        /* 标题多行截断：最多显示2行，超出部分用省略号替代 */
        line-height: 1.4; /* 标题行高，略小于摘要行高 */
        min-height: calc(2 * 1.4em);
        max-height: calc(2 * 1.4em); /* 最多2行的高度 */
        display: -webkit-box;
        -webkit-line-clamp: 2; /* 最多显示2行 */
        line-clamp: 2; /* 标准属性，兼容性增强 */
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .article-card h2 a {
        color: var(--text-primary);
        text-decoration: none;
        transition: color var(--transition-speed) ease;
    }

    .article-card h2 a:hover {
        text-decoration: underline;
        text-decoration-thickness: 2px; /* 让下划线更醒目一点 */
    }

    /* 
      设计理念: 元信息 (Meta)
      - 作者和日期是次要信息，使用 `--text-secondary` 颜色，建立视觉层级。
      - 使用 flex 和 gap 进行对齐和间距控制，符合现代 CSS 实践。
    */
    .article-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.5rem; /* 行间距0.5rem, 列间距1.5rem */
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 1.25rem;
    }

    .article-card-meta a {
        color: inherit; /* 继承父元素的次要文本颜色 */
        text-decoration: none;
    }

    .article-card-meta a:hover {
        color: var(--text-primary); /* 悬停时变为主要颜色以示可交互 */
        text-decoration: underline;
    }

    /* 日期前加一个分隔符，增强视觉分隔 */
    .article-card-meta .date::before {
        content: "·";
        margin-right: 1.5rem;
        font-weight: bold;
    }

    /* 
      设计理念: 摘要的可读性
      - 摘要是正文的延伸，应具有最佳的可读性。
      - 增加 `line-height` 是提升大段文字阅读体验的最重要手段之一，体现人文关怀。
    */
    .article-card-summary {
        margin: 0 0 1.5rem 0;
        line-height: 1.7; /* 提升阅读舒适度 */
        color: var(--text-primary);
        min-height: calc(2 * 1.7em);
        display: -webkit-box;
        -webkit-line-clamp: 2; /* 核心：最多显示2行 */
        line-clamp: 2; /* 标准属性，兼容性增强 */
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 
      设计理念: 标签作为 "芯片 (Chips)" - 现已增强为可滑动展示
      - 标签是分类元数据，使用 "芯片" 样式，使其看起来像可点击的实体。
      - 背景使用页面的主背景色，视觉上更轻量，与卡片主体形成区分。
      - 新增功能：鼠标悬停时可通过滚轮左右滑动查看更多标签
    */
    .article-card-tags {
        display: flex;
        flex-wrap: nowrap; /* 1. 禁止换行，强制所有标签在同一行 */
        gap: 0.5rem;
        overflow: hidden; /* 2. 隐藏超出容器宽度的内容 */
        position: relative;
        /* 渐变消失效果 - 右侧渐变 */
        -webkit-mask-image: linear-gradient(
            to right,
            black 90%,
            transparent 100%
        );
        mask-image: linear-gradient(to right, black 90%, transparent 100%);
        
        /* 新增：滑动功能样式 */
        scroll-behavior: smooth; /* 平滑滚动效果 */
        cursor: grab; /* 提示用户可以交互 */
        user-select: none; /* 防止文本选择干扰滑动 */
        
        /* 过渡效果：当鼠标悬停时显示可滑动状态 */
        transition: 
            -webkit-mask-image var(--transition-speed) ease,
            mask-image var(--transition-speed) ease,
            cursor var(--transition-speed) ease;
    }
    
    /* 悬停状态：增强视觉反馈，表明标签区域可交互 */
    .article-card-tags:hover {
        cursor: grab;
        /* 悬停时的渐变效果更明显，提示有更多内容 */
        -webkit-mask-image: linear-gradient(
            to right,
            black 85%,
            transparent 100%
        );
        mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    
    /* 活动状态：当鼠标按下时的视觉反馈 */
    .article-card-tags:active {
        cursor: grabbing;
    }

    .tag {
        display: inline-block;
        background-color: var(--background);
        color: var(--text-secondary);
        padding: 0.25rem 0.75rem;
        border-radius: var(--border-radius-md); /* 与卡片圆角保持一致或更小 */
        font-size: 0.8rem;
        font-weight: 500;
        /* 如果标签未来会成为链接，可以添加以下悬停效果 */
        /* 
        cursor: pointer;
        transition: background-color var(--transition-speed) ease;
        */
        flex-shrink: 0; /* 3. 防止标签被 Flexbox 压缩变形 */
    }

    /*
    .tag:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }
    */
</style>
