<script>
    import { goto } from "$app/navigation";
    import Modal from '$lib/components/Modal.svelte';

    let { data, children } = $props();

    let searchQuery = $state("");
    let user = $derived(data.user);

    function handleSearch() {
        if (searchQuery.trim()) {
            goto(`/search?q=${encodeURIComponent(searchQuery)}`);
            // 清除搜索框内容
            searchQuery = "";
        }
    }

    let showLogoutDialog = $state(false);

    async function handleLogout() {
        showLogoutDialog = true;
    }

    async function confirmLogout() {
        showLogoutDialog = false;
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                window.location.href = '/';
            } else {
                console.error('登出失败');
                alert('登出失败，请稍后再试');
            }
        } catch (error) {
            console.error('登出请求失败:', error);
            alert('登出失败，请稍后再试');
        }
    }

    function cancelLogout() {
        showLogoutDialog = false;
    }
</script>

<!-- 
  设计理念: 
  - 使用 <header> 作为承载导航的"材质卡片"。
  - position: sticky 和 backdrop-filter 创造出悬浮的"磨砂玻璃"效果，这是现代UI中常见的科技感元素。
  - 它在滚动时会覆盖在内容之上，提供了清晰的视觉层级。
-->
<header class="main-header">
    {#if showLogoutDialog}
        <Modal
            title="确认登出"
            content="确定要登出当前账号吗？"
            confirmText="确定"
            cancelText="取消"
            on:confirm={confirmLogout}
            on:cancel={cancelLogout}
        />
    {/if}
    <nav class="navbar">
        <div class="logo">
            <a href="/">Synapse</a>
        </div>

        <!-- 
          设计理念:
          - 将输入框和按钮整合为一个整体，更具现代感。
          - 使用 SVG 图标替代文字按钮，简洁高效。
          - :focus-within 伪类在用户与输入框交互时，为整个组件添加辉光效果，提供清晰的视觉反馈。
        -->
        <div class="search-bar">
            <input
                type="text"
                placeholder="探索知识的边界..."
                bind:value={searchQuery}
                onkeydown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onclick={handleSearch} aria-label="搜索">
                <!-- SVG Search Icon: 简洁、可缩放、可通过CSS控制颜色 -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    ></path>
                </svg>
            </button>
        </div>

        <!-- 
          设计理念:
          - 链接具有更大的点击区域和更柔和的背景反馈，而非简单的文字变色。
          - 这种"药丸"或"芯片"形状的背景反馈是Material Design的常见实践。
          - 对用户相关的操作（面板、登入登出）也使用图标，保持视觉统一性。
        -->
        <ul class="nav-links">
            <li><a href="/">首页</a></li>
            {#if user}
                <li>
                    <a href="/my" aria-label="我的">
                        <span class="nav-link-text">我的</span>
                    </a>
                </li>
                <li>
                    <a href="/my/message" aria-label="消息">
                        <span class="nav-link-text">消息</span>
                    </a>
                </li>
                <li>
                    <button 
                        onclick={handleLogout}
                        aria-label="登出"
                        class="logout-btn"
                    >
                        <!-- SVG Logout Icon -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path
                                d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                            ></path>
                        </svg>
                        <span class="nav-link-text">登出</span>
                    </button>
                </li>
            {:else}
                <li><a href="/login">登录</a></li>
                <li><a href="/register" class="register-btn">注册</a></li>
            {/if}
        </ul>
    </nav>
</header>

<!-- 
  为了让 sticky header 正常工作，
  主要内容需要和 header 分开，而不是被包裹在同一个 .container 里。
-->
<main class="main-content">
    {@render children()}
</main>

<style>
    /* 
      设计理念: CSS变量
      - 使用CSS变量统一定义颜色和样式，便于维护和未来的主题切换。
      - 采用不同深度的灰色来构建视觉层次，而不是纯黑(#000)，可以降低视觉疲劳，更具人文关怀。
    */
    :root {
        --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans",
            "Helvetica Neue", sans-serif;
        --text-primary: #212121; /* 主要文字，深灰色 */
        --text-secondary: #757575; /* 次要文字/图标，中灰色 */
        --surface-bg: rgba(
            255,
            255,
            255,
            0.85
        ); /* 表面背景，带透明度以配合毛玻璃效果 */
        --background: #f5f5f5; /* 页面主背景，浅灰色 */
        --hover-bg: #e0e0e0; /* 悬停背景色 */
        --border-color: #e0e0e0; /* 边框/分割线颜色 */
        --highlight-color: var(--text-primary); /* 强调色，直接用主文字颜色 */
        --border-radius-sm: 4px;
        --border-radius-md: 8px;
        --transition-speed: 0.2s;
    }

    /* 将样式应用到全局 */
    :global(body) {
        font-family: var(--font-family);
        background-color: var(--background);
        margin: 0;
    }

    .main-header {
        position: sticky;
        top: 0;
        z-index: 1000;
        width: 100%;
        background-color: var(--surface-bg);
        backdrop-filter: blur(10px); /* 毛玻璃效果，核心科技感元素 */
        -webkit-backdrop-filter: blur(10px);
        box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.05); /* 替代border，创造深度 */
        transition: box-shadow var(--transition-speed) ease;
    }

    .navbar {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.8rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .logo a {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        text-decoration: none;
        letter-spacing: -0.5px; /* 微调字间距，更精致 */
    }

    .search-bar {
        position: relative;
        display: flex;
        align-items: center;
        flex-grow: 1;
        max-width: 450px;
        transition: box-shadow var(--transition-speed) ease;
        border-radius: var(--border-radius-md);
    }

    /* 交互核心：当输入框或其内部任何元素获得焦点时，整个容器出现光晕 */
    .search-bar:focus-within {
        box-shadow: 0 0 0 2px var(--highlight-color);
    }

    .search-bar input {
        width: 100%;
        padding: 0.75rem 3rem 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: transparent;
        font-size: 1rem;
        color: var(--text-primary);
        outline: none;
        transition: border-color var(--transition-speed) ease;
    }
    .search-bar input::placeholder {
        color: var(--text-secondary);
        font-style: italic; /* 人文气息：给提示文字一点不同 */
    }

    .search-bar button {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        color: var(--text-secondary);
        transition:
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }
    .search-bar button:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }

    .search-bar svg {
        width: 1.5rem;
        height: 1.5rem;
    }

    .nav-links {
        display: flex;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 0.5rem;
    }

    .nav-links a {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        border-radius: var(--border-radius-md);
        transition:
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }
    .nav-links a:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }
    .nav-links a.register-btn {
        background-color: var(--text-primary);
        color: var(--surface-bg);
    }
    .nav-links a.register-btn:hover {
        background-color: #424242; /* 深色按钮的悬停效果 */
    }

    /* 
      设计理念: 登出按钮样式
      - 使其与导航链接保持视觉一致性
      - 但作为按钮而非链接处理
    */
    .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        color: var(--text-secondary);
        background: none;
        border: none;
        font-weight: 500;
        font-size: inherit;
        font-family: inherit;
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition:
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }
    .logout-btn:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }

    .nav-links svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* 移动端响应式设计 */
    @media (max-width: 900px) {
        .navbar {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        .search-bar {
            max-width: 100%;
            order: 1; /* 在移动端将搜索栏放在导航链接下面 */
        }
        .logo {
            text-align: center;
        }
        .nav-links {
            order: 2;
            justify-content: center;
            flex-wrap: wrap; /* 允许链接换行 */
        }
    }

    /* 在更小的屏幕上，隐藏部分链接的文字，只显示图标，节省空间 */
    @media (max-width: 480px) {
        .nav-link-text {
            display: none;
        }
        .nav-links a,
        .logout-btn {
            padding: 0.75rem; /* 调整为方形 */
        }
    }

    /* 主要内容区域 */
    .main-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
    }
</style>
