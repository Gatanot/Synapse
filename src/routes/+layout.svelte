<script>
    import { goto } from "$app/navigation";

    let { data, children } = $props(); // 添加 children prop 来接收子内容

    let searchQuery = $state(""); // 使用 $state() 替代 let

    // 使用 $derived 来获取用户数据
    let user = $derived(data.user);

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
                    onkeydown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button onclick={handleSearch} aria-label="搜索"> 搜索 </button>
            </div>
            <ul class="nav-links">
                <li><a href="/">首页</a></li>
                <li><a href="/topics">主题</a></li>
                {#if user}
                    <li><a href="/my/dashboard">我的面板</a></li>
                    <li><a href="/logout">登出</a></li>
                {:else}
                    <li><a href="/login">登录</a></li>
                    <li><a href="/register">注册</a></li>
                {/if}
            </ul>
        </nav>
    </header>

    <!-- 使用 {@render children()} 替代 <slot /> -->
    {@render children()}
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
