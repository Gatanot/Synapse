<script>
	import { goto } from "$app/navigation";
	import ArticleCard from "$lib/components/ArticleCard.svelte";

	let { data } = $props(); // 使用 $props() 替代 export let data

	// 使用 $derived 来获取数据
	let articles = $derived(data.articles);
	let user = $derived(data.user);

	function handleCreateArticle() {
		// 这里可以直接使用从布局传下来的 user 数据
		if (user) {
			goto("/my/articles/new");
		} else {
			goto("/login");
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
		transition: background-color 0.2s;
	}

	.create-button:hover {
		background-color: #0052a3;
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
