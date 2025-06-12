<script>
    import { goto } from "$app/navigation";

    /** @type {import('./$types').LayoutData} */
    export let data; // 从 +layout.server.ts 接收数据 (包含 user)

    let searchQuery = "";

    function handleSearch() {
        if (searchQuery.trim()) {
            goto(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    }
</script>

<div class="container">
    <header class="header">
        <nav class="navbar">
            <div class="logo">
                <a href="/">Synapse</a>
            </div>
            <div class="search-bar">
                <input
                    type="text"
                    placeholder="搜索文章..."
                    bind:value={searchQuery}
                    on:keydown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button on:click={handleSearch} aria-label="搜索">
                    搜索
                </button>
            </div>
            <ul class="nav-links">
                <li><a href="/">首页</a></li>
                <li><a href="/topics">主题</a></li>
                {#if data.user}
                    <li><a href="/my/dashboard">我的面板</a></li>
                    <li><a href="/api/logout">登出</a></li>
                {:else}
                    <li><a href="/login">登录</a></li>
                    <li><a href="/register">注册</a></li>
                {/if}
            </ul>
        </nav>
    </header>

    <!-- 这是关键！所有页面的内容都会被渲染在这里 -->
    <slot />
</div>

<style>
    /* 将与导航栏相关的样式移到这里 */
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    .header {
        padding: 1rem 0;
        border-bottom: 1px solid #eaeaea;
    }

    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .logo a {
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        text-decoration: none;
    }

    .search-bar {
        display: flex;
        flex-grow: 1;
        max-width: 400px;
    }

    .search-bar input {
        flex-grow: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
    }

    .search-bar button {
        padding: 0.5rem 1rem;
        background-color: #0066cc;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
    }

    .nav-links {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 1.5rem;
    }

    .nav-links a {
        color: #333;
        text-decoration: none;
    }

    .nav-links a:hover {
        color: #0066cc;
    }

    @media (max-width: 768px) {
        .navbar {
            flex-direction: column;
        }
        .search-bar {
            max-width: 100%;
        }
    }
</style>
