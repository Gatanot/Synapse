<script>
	import { goto } from "$app/navigation";
	import ArticleCard from "$lib/components/ArticleCard.svelte";

	let { data } = $props();

	let articles = $derived(data.articles);
	let user = $derived(data.user);

	function handleCreateArticle() {
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

<main class="main-content">
	<section class="page-header">
		<h1>最新文章</h1>
		<button class="primary-action-btn" onclick={handleCreateArticle}>
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
		<div class="empty-state">
			<p>这里空空如也，不如动手创作第一篇文章？</p>
		</div>
	{/if}
</main>

<style>
	/* 
      设计理念: 页面头部
      - 使用 Flexbox 实现标题和操作按钮的两端对齐，这是现代Web布局的经典模式。
      - 确保元素垂直居中，视觉上更稳定。
      - 保持足够的底部间距，将标题区域与内容主体清晰地分开。
    */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap; /* 在小屏幕上允许换行 */
		gap: 1rem;
		margin-bottom: 2.5rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0; /* 移除 h1 的默认 margin */
	}

	/* 
      设计理念: 主要操作按钮 (Primary Action Button)
      - 此按钮是页面上的一个主要 "Call to Action"。
      - 它的样式必须与 "注册" 按钮和文章编辑器中的 "发布" 按钮完全一致，
        以建立一个统一的、可预测的视觉语言。
    */
	.primary-action-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--border-radius-md);
		background-color: var(--text-primary);
		color: white; /* 或者 var(--surface-bg)，如果它是白色 */
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none; /* 确保如果未来变成<a>标签也没有下划线 */
		transition: background-color var(--transition-speed) ease;
	}

	.primary-action-btn:hover {
		background-color: #424242; /* 与其他主要按钮的悬停效果保持一致 */
	}

	/* 
      设计理念: 文章网格
      - 使用 CSS Grid 实现一个响应式的网格布局。
      - `repeat(auto-fill, minmax(340px, 1fr))` 是核心：它会自动用最小宽度为 340px 的卡片填充可用空间。
        当空间不足时，会自动变为单列布局，无需媒体查询即可实现优雅的响应式效果。
      - `gap` 属性提供了统一、干净的间距。
    */
	.articles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 2rem;
	}

	/* 
      设计理念: 空状态 (Empty State)
      - 空状态是界面的一部分，需要被设计，而不仅仅是显示一行文字。
      - 遵循 “人文关怀” 原则，提示文案应友好且具有引导性。
      - 视觉上，它应该是低调的，不刺眼的。使用次要文本颜色和柔和的背景/边框。
    */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background-color: #ffffff; /* 使用与卡片相同的背景色，感觉像一个“空卡片” */
		border: 1px dashed var(--border-color); /* 虚线边框暗示这是一个占位符/待填充区域 */
		border-radius: var(--border-radius-md);
	}

	.empty-state p {
		margin: 0;
		font-size: 1.1rem;
		color: var(--text-secondary);
		line-height: 1.7;
	}

	/* 
      设计理念: 响应式微调
      - 虽然网格本身是响应式的，但我们可以在小屏幕上调整页面头部的布局，
        使其从水平排列变为垂直堆叠，以获得更好的阅读流。
    */
	@media (max-width: 520px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start; /* 左对齐 */
		}
	}
</style>
