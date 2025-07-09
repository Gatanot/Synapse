<!-- +page.svelte (优化后) -->
<script>
    import ArticleCard from "$lib/components/ArticleCard.svelte";
    let { data } = $props();
    let articles = $derived(data.articles);
    let user = $derived(data.user);
</script>

<svelte:head>
    <title>{user?.name || '用户'} - Synapse</title>
    <meta name="description" content="查看 {user?.name || '用户'} 的个人主页和文章" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <h1>{user?.name || '用户'} 的主页</h1>
    </section>

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

    <section class="articles-section">
        <h2>用户文章列表</h2>
        
        {#if articles && articles.length > 0}
            <div class="articles-grid">
                {#each articles as article}
                    <ArticleCard {article} />
                {/each}
            </div>
        {:else}
            <div class="empty-state">
                <p>该用户暂无发布的文章</p>
            </div>
        {/if}
    </section>
</main>

<style>
    /* 
      设计理念: 页面头部
      - 与主站保持一致的头部设计风格
    */
    .page-header {
        margin-bottom: 2.5rem;
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    /* 
      设计理念: 用户信息卡片
      - 使用与主站相同的卡片设计风格
    */
    .user-profile {
        margin-bottom: 2.5rem;
        padding: 2rem;
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .user-profile h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1.5rem 0;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .profile-field {
        margin-bottom: 0.75rem;
        font-size: 1.1rem;
        line-height: 1.5;
    }

    .label {
        color: var(--text-secondary);
        font-weight: 600;
        margin-right: 0.5em;
    }

    /* 
      设计理念: 文章区域
      - 清晰的区域分隔
    */
    .articles-section {
        margin-bottom: 2rem;
    }

    .articles-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 2rem 0;
    }

    /* 
      设计理念: 文章网格布局
      - 与主页完全相同的网格布局
      - 使用 CSS Grid 实现响应式的网格布局
    */
    .articles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 2rem;
    }

    /* 
      设计理念: 空状态
      - 与主页保持一致的空状态设计
    */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background-color: #ffffff;
        border: 1px dashed var(--border-color);
        border-radius: var(--border-radius-md);
    }

    .empty-state p {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-secondary);
        line-height: 1.7;
    }

    /* 
      设计理念: 响应式设计
      - 在小屏幕上优化布局和间距
    */
    @media (max-width: 768px) {
        .page-header h1 {
            font-size: 2rem;
        }

        .user-profile {
            padding: 1.5rem;
        }

        .user-profile h2 {
            font-size: 1.25rem;
        }

        .profile-field {
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .page-header h1 {
            font-size: 1.75rem;
        }

        .user-profile {
            padding: 1.25rem;
        }

        .articles-section h2 {
            font-size: 1.25rem;
        }
    }
</style>
