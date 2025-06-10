<!-- todo:
逻辑:页面加载时获取:最新的10篇文章
界面:导航栏,用于快速导航(可能提取为'+layout.svelte')(包含一个搜索框);文章列表;一个按钮,点击后用户已登陆则跳转至新建文章界面,否则跳转至登陆界面
样式:待定 -->

<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import ArticleCard from "$lib/components/ArticleCard.svelte";

	/** @type {import('./$types').PageData} */
	export let data;

	let { articles } = data;
	let searchQuery = "";

	function handleCreateArticle() {
		if (data.user) {
			goto("/my/article/new");
		} else {
			goto("/login");
		}
	}

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery)}`);
		}
	}
</script>

<svelte:head>
	<title>Synapse - 首页</title>
	<meta name="description" content="发现最新文章和思想" />
</svelte:head>

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
				<button onclick={handleSearch} aria-label="搜索">
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

	<main class="main-content">
		<section class="articles-header">
			<h1>最新文章</h1>
			<button class="create-button" onclick={handleCreateArticle}>
				创建新文章
			</button>
		</section>

		{#if articles && articles.length > 0}
			<div class="articles-grid">
				{#each articles as article}
					<ArticleCard {article} />
				{/each}
			</div>
		{:else}
			<div class="no-articles">
				<p>暂无文章可显示</p>
			</div>
		{/if}
	</main>
</div>

<style>
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

	.main-content {
		padding: 2rem 0;
	}

	.articles-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.create-button {
		background-color: #0066cc;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.articles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.no-articles {
		text-align: center;
		padding: 3rem 0;
		color: #666;
	}

	@media (max-width: 768px) {
		.navbar {
			flex-direction: column;
		}

		.search-bar {
			max-width: 100%;
		}

		.articles-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}
	}
</style>
