<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import type { ArticleClient, UserClient } from "$lib/types/client";
	import { marked } from "marked";
	import CommentForm from "$lib/components/CommentForm.svelte";
	import CommentList from "$lib/components/CommentList.svelte";

	// 接收用户数据
	let { data } = $props<{ data: { user: UserClient | null } }>();

	// 配置marked选项
	marked.setOptions({
		breaks: true,
		gfm: true,
	});

	// 定义状态
	let article: ArticleClient | null = $state(null);
	let error: string | null = $state(null);
	let loading = $state(true);
	let isMarkdownMode = $state(true);

	// 点赞相关状态
	let isLiked = $state(false);
	let likeCount = $state(0);
	let likeButtonDisabled = $state(false);

	// 评论相关状态
	let showCommentForm = $state(false);
	let commentList: CommentList | null = $state(null);
	let commentForm: CommentForm | null = $state(null);

	// 从页面参数中获取文章 ID
	const articleId = $derived($page.params._id);
	const user = $derived(data.user);

	// 检查用户是否已点赞该文章
	function checkIfLiked() {
		if (!user || !article) return false;
		return user.likes.includes(article._id);
	}

	// 立即发送点赞/取消点赞请求
	async function toggleLike() {
		if (!user || !article) {
			return;
		}
		if (likeButtonDisabled) return;

		likeButtonDisabled = true;
		const originalIsLiked = isLiked;
		const originalLikeCount = likeCount;
		isLiked = !isLiked;
		likeCount = isLiked ? likeCount + 1 : likeCount - 1;

		try {
			const response = await fetch(`/api/articles/${articleId}/like`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("点赞请求失败");
			}
			const result = await response.json();
			if (result.success) {
				likeCount = result.newLikesCount;
				if (result.action === "liked") {
					user.likes.push(article._id);
				} else if (result.action === "unliked") {
					const index = user.likes.indexOf(article._id);
					if (index > -1) user.likes.splice(index, 1);
				}
			} else {
				throw new Error(result.message || "点赞操作失败");
			}
		} catch (error) {
			isLiked = originalIsLiked;
			likeCount = originalLikeCount;
			console.error("点赞操作出错:", error);
		} finally {
			likeButtonDisabled = false;
		}
	}

	// 格式化日期函数
	function formatDate(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	// 在组件挂载时获取文章数据
	onMount(async () => {
		try {
			loading = true;
			const response = await fetch(`/api/articles/${articleId}`);

			if (!response.ok) {
				if (response.status === 404)
					error = `文章 ID ${articleId} 未找到`;
				else if (response.status === 400) error = "无效的文章 ID";
				else error = "获取文章时发生服务器错误";
				return;
			}
			const articleData: ArticleClient = await response.json();
			article = {
				...articleData,
				createdAt: new Date(articleData.createdAt),
			};
			likeCount = article.likes || 0;
			isLiked = checkIfLiked();
		} catch (err) {
			console.error("获取文章失败:", err);
			error = "无法连接到服务器，请稍后再试";
		} finally {
			loading = false;
		}
	});

	// 处理返回文章列表
	function handleBack() {
		goto("/");
	}

	// 切换Markdown渲染模式
	function toggleMarkdownMode() {
		isMarkdownMode = !isMarkdownMode;
	}

	// 返回顶部
	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	// 获取渲染后的Markdown内容
	function getRenderedContent(content: string): string {
		if (!content) return "";
		if (isMarkdownMode) {
			try {
				return marked.parse(content) as string;
			} catch (error) {
				console.error("Markdown parsing error:", error);
				return content;
			}
		} else {
			return content;
		}
	}

	// 处理评论表单提交
	async function handleCommentSubmit(
		event: CustomEvent<{ content: string }>,
	) {
		if (!user || !articleId) {
			commentForm?.setError("用户未登录或文章ID无效");
			return;
		}

		try {
			const response = await fetch("/api/comments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content: event.detail.content,
					articleId,
				}),
			});
			const result = await response.json();

			if (result.success) {
				commentForm?.clearForm();
				showCommentForm = false;
				commentList?.refreshComments();
			} else {
				commentForm?.setError(result.message || "评论发布失败");
			}
		} catch (err) {
			console.error("评论提交失败:", err);
			commentForm?.setError("评论提交时发生网络错误，请重试");
		}
	}

	// 处理评论表单取消
	function handleCommentCancel() {
		showCommentForm = false;
	}

	// 显示评论表单
	function showCommentFormHandler() {
		if (!user) {
			goto("/login");
			return;
		}
		showCommentForm = true;
	}
</script>

<main class="main-content">
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
				<button onclick={handleBack} class="btn btn-primary">
					返回首页
				</button>
			</div>
		{:else if article}
			<article class="article-content">
				<header>
					<h1>{article.title}</h1>
					<div class="article-meta">
						<span class="author">
							<a href="/users/{article.authorId}"
								>{article.authorName}</a
							>
						</span>
						<span class="date"
							>{formatDate(article.createdAt.toISOString())}</span
						>
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

			<!-- 评论区域 -->
			<div class="comments-section">
				<CommentList
					bind:this={commentList}
					{articleId}
					initialLoad={true}
				/>

				{#if !showCommentForm}
					<div class="comment-actions">
						<!-- 修复：使用已有的按钮系统 -->
						<button
							class="btn btn-primary"
							onclick={showCommentFormHandler}
						>
							{#if user}
								写评论
							{:else}
								登录后评论
							{/if}
						</button>
					</div>
				{/if}

				{#if showCommentForm}
					<CommentForm
						bind:this={commentForm}
						on:submit={handleCommentSubmit}
						on:cancel={handleCommentCancel}
					/>
				{/if}
			</div>
		{/if}

		<!-- 悬浮工具栏 -->
		{#if !loading && !error && article}
			<div class="floating-toolbar">
				<button
					onclick={handleBack}
					class="toolbar-button"
					title="返回首页"
					aria-label="返回首页"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M19 12H5M12 19l-7-7 7-7" /></svg
					>
				</button>
				<button
					onclick={scrollToTop}
					class="toolbar-button"
					title="返回顶部"
					aria-label="返回顶部"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M18 15l-6-6-6 6" /></svg
					>
				</button>
				<button
					onclick={toggleLike}
					class="toolbar-button like-button"
					class:liked={isLiked}
					class:disabled={!user}
					disabled={!user || likeButtonDisabled}
					title={!user
						? "登录后可以点赞"
						: isLiked
							? "取消点赞"
							: "点赞"}
					aria-label={!user
						? "登录后可以点赞"
						: isLiked
							? "取消点赞"
							: "点赞"}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill={isLiked ? "currentColor" : "none"}
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
						/></svg
					>
					<span class="like-count">{likeCount}</span>
				</button>
				{#if article.body}
					<button
						onclick={toggleMarkdownMode}
						class="toolbar-button"
						title={isMarkdownMode ? "显示源码" : "渲染 Markdown"}
						aria-label={isMarkdownMode
							? "显示源码"
							: "渲染 Markdown"}
					>
						{isMarkdownMode ? "MD" : "RAW"}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</main>

{#if !user && !loading && !error && article}
	<div class="login-prompt">
		<p>登录后可以点赞文章和发表评论</p>
		<a href="/login" class="login-link">去登录</a>
	</div>
{/if}

<style>
	/* === 基础布局与容器 === */
	main.main-content {
		/* 修复：与全局布局类名一致 */
		display: flex;
		justify-content: center;
		padding: 2rem 1.5rem; /* 与全局一致 */
		background-color: var(--background);
	}
	.article-container {
		width: 100%;
		max-width: 800px;
	}

	/* === 状态卡片 (加载/错误) === */
	.status-card {
		background-color: #ffffff; /* 修复：使用纯白 */
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
		border-left: 4px solid var(--error-color, #d32f2f);
	}
	.error-card h2 {
		font-size: 1.5rem;
		color: var(--error-color, #d32f2f);
		margin: 0;
	}
	.error-card p {
		font-size: 1rem;
		color: var(--text-primary);
		line-height: 1.7;
	}

	/* === 文章内容卡片 === */
	.article-content {
		background-color: #ffffff; /* 修复：使用纯白 */
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
		content: "·";
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
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 500;
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

	/* === 文章正文 (Prose & Raw) === */
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
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		font-size: 0.875em;
		word-wrap: break-word;
		word-break: break-word;
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
	.raw-content {
		background-color: var(--background);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		padding: 1.5rem;
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-primary);
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-x: auto;
		margin: 0;
	}
	/* --- MERGE CONFLICT RESOLUTION: KEPT FROM main BRANCH --- */
	.empty-content {
		text-align: center;
		font-style: italic;
		color: var(--text-secondary);
		padding: 3rem 1rem;
		background-color: var(--background);
		border-radius: var(--border-radius-md);
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
		background-color: #ffffff; /* 修复：使用纯白 */
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
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
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
		color: #ffffff; /* 修复：使用纯白 */
		border-color: var(--text-primary);
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	.toolbar-button svg {
		width: 20px;
		height: 20px;
	}
	.like-button.liked {
		background-color: #ff6b6b;
		color: white;
		border-color: #ff6b6b;
	}
	.like-button.liked:hover {
		background-color: #ff5252;
		border-color: #ff5252;
	}
	.like-button.disabled {
		background-color: var(--hover-bg);
		color: var(--text-secondary);
		border-color: var(--border-color);
		cursor: not-allowed;
		opacity: 0.6;
	}
	.like-button.disabled:hover {
		background-color: var(--hover-bg);
		color: var(--text-secondary);
		border-color: var(--border-color);
		transform: none;
		box-shadow: none;
	}
	.floating-toolbar .like-button {
		order: 99;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.1rem;
		position: relative;
		margin-top: 0;
	}
	.floating-toolbar .like-button::before {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--border-color);
		top: -0.375rem;
	}
	.like-count {
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1;
		min-width: 1rem;
		text-align: center;
	}

	/* === 登录提示 === */
	.login-prompt {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background-color: #ffffff; /* 修复：使用纯白 */
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius-md);
		padding: 1rem 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 200;
	}
	.login-prompt p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	.login-link {
		background-color: var(--text-primary);
		color: #ffffff; /* 修复：使用纯白 */
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: var(--border-radius-sm);
		font-size: 0.875rem;
		font-weight: 600;
		transition: background-color var(--transition-speed) ease;
	}
	.login-link:hover {
		background-color: #000;
	}

	/* --- MERGE CONFLICT RESOLUTION: KEPT FROM add_comments BRANCH & REFACTORED --- */
	.comments-section {
		margin-top: 3rem;
	}
	.comment-actions {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}
	/* 注意：.comment-btn 的具体样式已被移除，转而使用通用的 .btn 和 .btn-primary 类 */

	/* === 响应式设计 === */
	@media (max-width: 768px) {
		main.main-content {
			padding: 1rem;
		}
		.article-content {
			padding: 1.5rem;
		}
		header h1 {
			font-size: 2rem;
		}
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

		/* --- MERGE CONFLICT RESOLUTION: KEPT BOTH --- */
		.comments-section {
			margin-top: 2rem;
		}
		/* “写评论”按钮现在使用通用按钮类，其响应式已在全局处理，无需特定规则 */
		.floating-toolbar .like-button::before {
			top: -0.25rem;
		}
	}

	/* 修复：添加通用的 .btn 样式以供复用 */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 2rem;
		border: 1px solid transparent;
		border-radius: var(--border-radius-md);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.btn-primary {
		background-color: var(--text-primary);
		color: white; /* 修复：使用纯白 */
	}
	.btn-primary:hover {
		background-color: #000;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
