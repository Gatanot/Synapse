<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { ArticleClient } from "$lib/types/client";

    // 定义状态
    let article: ArticleClient | null = null;
    let error: string | null = null;
    let loading = true;

    // 从页面参数中获取文章 ID
    $: articleId = $page.params._id;

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
                // 根据 HTTP 状态码处理错误
                if (response.status === 404) {
                    error = `文章 ID ${articleId} 未找到`;
                } else if (response.status === 400) {
                    error = "无效的文章 ID";
                } else {
                    error = "获取文章时发生服务器错误";
                }
                return;
            }

            // 解析 JSON 数据
            const data: ArticleClient = await response.json();
            // 确保 createdAt 是 Date 对象（如果后端返回字符串）
            article = {
                ...data,
                createdAt: new Date(data.createdAt),
            };
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
</script>

<main
    class="container mx-auto max-w-4xl px-6 py-12 min-h-screen flex items-center justify-center"
>
    {#if loading}
        <div
            class="flex flex-col items-center justify-center h-64 border-2 border-gray-200 rounded-lg p-8 bg-white shadow-md"
        >
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"
            ></div>
            <p class="mt-4 text-lg text-gray-600 font-medium">加载中...</p>
        </div>
    {:else if error}
        <div
            class="text-center bg-white p-8 rounded-lg shadow-md border-2 border-red-200 w-full max-w-lg"
        >
            <h2 class="text-2xl font-bold text-red-600 mb-4">错误</h2>
            <p class="mb-6 text-red-500 text-lg">{error}</p>
            <button
                on:click={handleBack}
                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
                返回首页
            </button>
        </div>
    {:else if article}
        <article
            class="space-y-8 bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200 w-full"
        >
            <h1
                class="text-4xl font-extrabold text-gray-900 leading-tight text-center"
            >
                标题： {article.title}
            </h1>
            <div
                class="text-gray-500 text-sm italic flex flex-col sm:flex-row sm:gap-4 justify-center"
            >
                <span>作者: {article.authorName}</span>
                <span
                    >发布日期: {formatDate(
                        article.createdAt.toISOString(),
                    )}</span
                >
            </div>
            <div class="flex flex-wrap gap-2 justify-center">
                {#each article.tags as tag}
                    <span
                        class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-150 cursor-default"
                    >
                        标签： {tag}
                    </span>
                {/each}
            </div>
            <p class="text-xl font-semibold text-gray-700 text-center">
                概要： {article.summary}
            </p>
            {#if article.body}
                <div class="prose max-w-none text-gray-800 mx-auto">
                    {@html article.body}
                </div>
            {:else}
                <p class="text-gray-500 italic text-lg text-center">
                    文章内容暂不可用
                </p>
            {/if}
            <div class="text-center">
                <button
                    on:click={handleBack}
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                >
                    返回首页
                </button>
            </div>
        </article>
    {/if}
</main>

<style>
    
    .prose :global(p) {
        line-height: 1.8;
        margin-bottom: 1.25rem;
        color: #374151;
    }
    .prose :global(h2) {
        font-size: 1.75rem;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1.25rem;
        color: #1f2937;
    }
    .prose :global(h3) {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 1.75rem;
        margin-bottom: 1rem;
    }
    .prose :global(ul),
    .prose :global(ol) {
        margin-left: 1.75rem;
        margin-bottom: 1.25rem;
        color: #374151;
    }
    .prose :global(li) {
        margin-bottom: 0.5rem;
    }
</style>
