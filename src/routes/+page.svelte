<script>
	import { goto } from '$app/navigation';
	import ArticleCard from '$lib/components/ArticleCard.svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	// SvelteKit 会自动合并布局和页面的 data。
	// 所以这里的 data 同时包含来自 +layout.server.ts 的 user
	// 和来自 +page.server.ts 的 articles。
	let { articles, user } = data;

	function handleCreateArticle() {
		// 这里可以直接使用从布局传下来的 user 数据
		if (user) {
			goto('/my/articles/new');
		} else {
			goto('/login');
		}
	}
</script>

<svelte:head>
	<title>Synapse - 首页</title>
	<meta name="description" content="发现最新文章和思想" />
</svelte:head>

<!-- 不再需要 .container, 因为它已经在布局中了 -->
<main class="main-content">
	<section class="articles-header">
		<h1>最新文章</h1>
		<button class="create-button" on:click={handleCreateArticle}> 创建新文章 </button>
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

<style>
	/* 只保留与页面内容相关的样式 */
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
		.articles-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}
	}
</style>