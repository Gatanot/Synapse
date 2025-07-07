<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ArticleClient } from '$lib/types/client';
	import { marked } from 'marked';

	// 配置marked选项
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	// 定义状态
	let article: ArticleClient | null = null;
	let error: string | null = null;
	let loading = true;
	let isMarkdownMode = true; // 默认开启Markdown渲染模式

	// 从页面参数中获取文章 ID
	$: articleId = $page.params._id;

	// 格式化日期函数
	function formatDate(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// 在组件挂载时获取文章数据
	onMount(async () => {
		try {
			loading = true;
			const response = await fetch(`/api/articles/${articleId}`);

			if (!response.ok) {
				// 根据 HTTP 状态码处理错误
				if (response.status === 404) {
					error = `文章 ID ${articleId} 未找到`;
				} else if (response.status === 400) {
					error = '无效的文章 ID';
				} else {
					error = '获取文章时发生服务器错误';
				}
				return;
			}

			// 解析 JSON 数据
			const data: ArticleClient = await response.json();
			// 确保 createdAt 是 Date 对象（如果后端返回字符串）
			article = {
				...data,
				createdAt: new Date(data.createdAt)
			};
		} catch (err) {
			console.error('获取文章失败:', err);
			error = '无法连接到服务器，请稍后再试';
		} finally {
			loading = false;
		}
	});

	// 处理返回文章列表
	function handleBack() {
		goto('/');
	}

	// 切换Markdown渲染模式
	function toggleMarkdownMode() {
		isMarkdownMode = !isMarkdownMode;
	}

	// 返回顶部
	function scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	// 获取渲染后的Markdown内容
	function getRenderedContent(content: string): string {
		if (!content) return '';
		if (isMarkdownMode) {
			try {
				return marked.parse(content) as string;
			} catch (error) {
				console.error('Markdown parsing error:', error);
				return content; // 如果解析失败，返回原始内容
			}
		} else {
			return content;
		}
	}
</script>

<main>
	<div class="article-container">
		{#if loading}
			<div class="status-card loading-card">
				<div class="spinner"></div>
				<p>加载中...</p>
			</div>
		{:else if error}
			<div class="status-card error-card">
				<h2>出错了</h2>
				<p>{error}</p>
				<button on:click={handleBack} class="action-button"> 返回首页 </button>
			</div>
		{:else if article}
			<article class="article-content">
				<header>
					<h1>{article.title}</h1>
					<div class="article-meta">
						<span class="author">
							<a href="/users/{article.authorId}">{article.authorName}</a>
						</span>
						<span class="date">{formatDate(article.createdAt.toISOString())}</span>
					</div>
					{#if article.tags && article.tags.length > 0}
						<div class="article-tags">
							{#each article.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					{/if}
				</header>

				<p class="article-summary">{article.summary}</p>

				{#if article.body}
					<div class="content-container">
						{#if isMarkdownMode}
							<div class="prose">
								{@html getRenderedContent(article.body)}
							</div>
						{:else}
							<pre class="raw-content">{article.body}</pre>
						{/if}
					</div>
				{:else}
					<p class="empty-content">文章内容暂不可用</p>
				{/if}
			</article>
		{/if}
		
		<!-- 悬浮工具栏 -->
		{#if !loading && !error && article}
			<div class="floating-toolbar">
				<button 
					on:click={handleBack}
					class="toolbar-button"
					title="返回首页"
					aria-label="返回首页"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
				</button>
				
				<button 
					on:click={scrollToTop}
					class="toolbar-button"
					title="返回顶部"
					aria-label="返回顶部"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 15l-6-6-6 6"/>
					</svg>
				</button>
				
				{#if article.body}
					<button 
						on:click={toggleMarkdownMode}
						class="toolbar-button"
						title={isMarkdownMode ? '显示源码' : '渲染 Markdown'}
						aria-label={isMarkdownMode ? '显示源码' : '渲染 Markdown'}
					>
						{isMarkdownMode ? 'MD' : 'RAW'}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</main>

<style>
	/* === 基础布局与容器 === */
	main {
		display: flex;
		justify-content: center;
		padding: 2rem 1rem;
		min-height: 100vh;
		background-color: var(--background);
	}

	.article-container {
		width: 100%;
		max-width: 800px;
	}

	/* === 状态卡片 (加载/错误) === */
	.status-card {
		background-color: var(--surface-bg);
		border-radius: var(--border-radius-md);
		padding: 2rem;
		text-align: center;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 2px 6px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.loading-card p {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 4px solid var(--hover-bg);
		border-top-color: var(--text-primary);
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-card {
		border-left: 4px solid var(--error-color);
	}

	.error-card h2 {
		font-size: 1.5rem;
		color: var(--error-color);
		margin: 0;
	}

	.error-card p {
		font-size: 1rem;
		color: var(--text-primary);
		line-height: 1.7;
	}

	/* === 主要操作按钮 === */
	.action-button {
		background-color: var(--text-primary);
		color: var(--surface-bg);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: var(--border-radius-md);
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color var(--transition-speed) ease,
			transform var(--transition-speed) ease;
	}

	.action-button:hover {
		background-color: #000;
		transform: translateY(-2px);
	}

	.action-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
	}

	/* === 文章内容卡片 === */
	.article-content {
		background-color: var(--surface-bg);
		border-radius: var(--border-radius-md);
		padding: 2.5rem 3rem;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 2px 6px rgba(0, 0, 0, 0.04);
	}

	/* === 文章头部 === */
	header {
		text-align: center;
		margin-bottom: 2.5rem;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 2rem;
	}

	header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1.2;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
	}

	/* === 文章元信息 === */
	.article-meta {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	.article-meta a {
		color: inherit;
		text-decoration: none;
		transition: color var(--transition-speed) ease;
	}

	.article-meta a:hover {
		color: var(--text-primary);
		text-decoration: underline;
	}

	.article-meta .date::before {
		content: '·';
		margin-right: 1.5rem;
		font-weight: bold;
	}

	/* === 文章标签 === */
	.article-tags {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.tag {
		background-color: var(--background);
		color: var(--text-secondary);
		padding: 0.25rem 0.75rem;
		border-radius: 999px; /* 使用胶囊形状 */
		font-size: 0.8rem;
		font-weight: 500;
		cursor: default; /* 如果标签不可点击 */
	}

	/* === 文章摘要 === */
	.article-summary {
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0 0 2.5rem 0;
		padding-left: 1.5rem;
		border-left: 3px solid var(--border-color);
	}

	/* === 文章正文 (Prose) === */
	.content-container {
		position: relative;
	}

	.prose {
		line-height: 1.7;
		color: var(--text-primary);
	}

	.prose :global(p) {
		margin-bottom: 1.25rem;
	}

	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		margin-top: 2.5rem;
		margin-bottom: 1.25rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.prose :global(h2) {
		font-size: 1.75rem;
	}

	.prose :global(h3) {
		font-size: 1.5rem;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.5rem;
	}

	.prose :global(blockquote) {
		border-left: 4px solid var(--border-color);
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: var(--text-secondary);
	}

	.prose :global(code) {
		background-color: var(--background);
		padding: 0.125rem 0.25rem;
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875em;
        overflow-wrap: break-word;
        word-wrap: break-word;     /* 兼容旧浏览器 */
        word-break: break-word;    /* 增强换行能力 */
	}

	.prose :global(pre) {
		background-color: var(--background);
		padding: 1rem;
		border-radius: var(--border-radius-md);
		overflow-x: auto;
		margin: 1.5rem 0;
	}

	.prose :global(pre code) {
		background-color: transparent;
		padding: 0;
	}

	/* 原始内容样式 */
	.raw-content {
		background-color: var(--background);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		padding: 1.5rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-x: auto;
		margin: 0;
	}

	/* === 悬浮工具栏 === */
	.floating-toolbar {
		position: fixed;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 100;
		background-color: var(--surface-bg);
		border-radius: var(--border-radius-md);
		padding: 1rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 2px 6px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--border-color);
	}

	.toolbar-button {
		background-color: var(--background);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.75rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		cursor: pointer;
		transition: 
			background-color var(--transition-speed) ease,
			color var(--transition-speed) ease,
			border-color var(--transition-speed) ease,
			transform var(--transition-speed) ease,
			box-shadow var(--transition-speed) ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 3rem;
		min-height: 3rem;
	}

	.toolbar-button:hover {
		background-color: var(--text-primary);
		color: var(--surface-bg);
		border-color: var(--text-primary);
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.toolbar-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
	}

	.toolbar-button svg {
		width: 20px;
		height: 20px;
	}

	/* 更多 prose 样式可按需添加... */

	.empty-content {
		text-align: center;
		font-style: italic;
		color: var(--text-secondary);
		padding: 3rem 1rem;
		background-color: var(--background);
		border-radius: var(--border-radius-md);
		border: 1px dashed var(--border-color);
	}

	/* === 响应式设计 === */
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		.article-content {
			padding: 2rem;
		}
		header h1 {
			font-size: 2rem;
		}
		
		/* 移动端悬浮工具栏调整 */
		.floating-toolbar {
			right: 1rem;
			padding: 0.75rem;
			gap: 0.5rem;
		}
		
		.toolbar-button {
			min-width: 2.5rem;
			min-height: 2.5rem;
			padding: 0.5rem;
			font-size: 0.75rem;
		}
		
		.toolbar-button svg {
			width: 18px;
			height: 18px;
		}
	}
</style>