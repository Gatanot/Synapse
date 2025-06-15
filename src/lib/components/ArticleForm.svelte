<script lang="ts">
  import { onMount } from "svelte";
  
  // 定义属性接口
  // 定义接口
  interface Article {
    title?: string;
    summary?: string;
    tags?: string[];
    body?: string;
  }

  // 使用 $props() 解构赋值方式声明属性（正确写法）
  const {
    user = { _id: "" },
    initialArticle = {} as Article,
    submitHandler = async () => "",
    submitButtonText = "发布文章",
    formTitle = "创建文章",
    articleId = undefined
  } = $props<{
    user?: {
      _id: string;
      name?: string;
      email?: string;
    };
    initialArticle?: Article;
    submitHandler: (articleData: any) => Promise<string>;
    submitButtonText?: string;
    formTitle?: string;
    articleId?: string;
  }>();

  // 表单状态（使用 $state）
  let title = $state(initialArticle.title || "");
  let summary = $state(initialArticle.summary || "");
  let tags = $state(initialArticle.tags || []);
  let body = $state(initialArticle.body || "");
  let tagInput = $state("");
  let errorMessage = $state("");
  let successMessage = $state("");
  
  // 表单错误状态
  let errors = $state({
    title: "",
    summary: "",
    tags: "",
    body: "",
  });
  // 处理标签输入
  function handleTagInput(event: KeyboardEvent): void {
    if (event.key === "Enter" && tagInput.trim()) {
      if (tags.length >= 10) {
        errors.tags = "最多只能添加10个标签";
        return;
      }
      if (tags.includes(tagInput.trim())) {
        errors.tags = "标签不能重复";
        return;
      }
      tags = [...tags, tagInput.trim()];
      tagInput = "";
      errors.tags = "";
    }
  }

  // 删除标签
  function removeTag(tagToRemove: string): void {
    tags = tags.filter((tag) => tag !== tagToRemove);
    errors.tags = "";
  }

  // 提交表单
  async function handleSubmit(): Promise<void> {
    // 重置错误和成功消息
    errors = { title: "", summary: "", tags: "", body: "" };
    errorMessage = "";
    successMessage = "";

    // 客户端验证
    if (!title.trim()) {
      errors.title = "标题不能为空";
      return;
    }
    if (title.length > 200) {
      errors.title = "标题不能超过200个字符";
      return;
    }
    if (!summary.trim()) {
      errors.summary = "简介不能为空";
      return;
    }
    if (summary.length > 500) {
      errors.summary = "简介不能超过500个字符";
      return;
    }
    if (tags.length === 0) {
      errors.tags = "请至少添加一个标签";
      return;
    }
    if (!body.trim()) {
      errors.body = "正文不能为空";
      return;
    }

    // 构造请求数据
    const articleData = {
      title: title.trim(),
      summary: summary.trim(),
      tags,
      body: body.trim(),
      status: "published",
    };

    try {
      const message = await submitHandler(articleData);
      successMessage = message;
      
      // 如果是创建新文章，提交后清空表单
      if (submitButtonText === "发布文章") {
        title = "";
        summary = "";
        tags = [];
        body = "";
        tagInput = "";
      }
    } catch (err: any) {
      errorMessage = err.message || "操作失败，请稍后重试。";
    }
  }

  // 当 initialArticle 变化时更新表单
  $effect(() => {
    if (initialArticle) {
      title = initialArticle.title || "";
      summary = initialArticle.summary || "";
      tags = initialArticle.tags || [];
      body = initialArticle.body || "";
    }
  });
</script>

<div class="container mx-auto p-4 max-w-3xl">
  {#if !user?._id}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      请登录以创建文章。
      <a href="/login" class="underline">去登录</a>
    </div>
  {:else}
    <h1 class="text-2xl font-bold mb-6">{formTitle}</h1>
    
    {#if articleId}
      <p class="text-gray-700 mb-4">文章 ID: {articleId}</p>
    {/if}

    <!-- 错误提示 -->
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {errorMessage}
      </div>
    {/if}

    <!-- 成功提示 -->
    {#if successMessage}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {successMessage}
      </div>
    {/if}

    <!-- 表单 -->
    <div class="space-y-4">
      <!-- 标题 -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">标题</label>
        <input
          type="text"
          id="title"
          bind:value={title}
          class="mt-1 block w-full border {errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="请输入文章标题"
          maxlength="200"
        />
        {#if errors.title}
          <p class="text-red-500 text-sm mt-1">{errors.title}</p>
        {/if}
      </div>

      <!-- 简介 -->
      <div>
        <label for="summary" class="block text-sm font-medium text-gray-700">简介</label>
        <textarea
          id="summary"
          bind:value={summary}
          class="mt-1 block w-full border {errors.summary ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="请输入文章简介"
          rows="3"
          maxlength="500"
        ></textarea>
        {#if errors.summary}
          <p class="text-red-500 text-sm mt-1">{errors.summary}</p>
        {/if}
      </div>

      <!-- 标签 -->
      <div>
        <label for="tags" class="block text-sm font-medium text-gray-700">标签</label>
        <input
          type="text"
          id="tags"
          bind:value={tagInput}
          onkeydown={handleTagInput}
          class="mt-1 block w-full border {errors.tags ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="输入标签后按回车添加"
        />
        <div class="mt-2 flex flex-wrap gap-2">
          {#each tags as tag}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {tag}
              <button
                type="button"
                onclick={() => removeTag(tag)}
                class="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                &times;
              </button>
            </span>
          {/each}
        </div>
        {#if errors.tags}
          <p class="text-red-500 text-sm mt-1">{errors.tags}</p>
        {/if}
      </div>

      <!-- 正文 -->
      <div>
        <label for="body" class="block text-sm font-medium text-gray-700">正文 (Markdown)</label>
        <textarea
          id="body"
          bind:value={body}
          class="mt-1 block w-full border {errors.body ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="请输入文章正文 (支持Markdown)"
          rows="10"
        ></textarea>
        {#if errors.body}
          <p class="text-red-500 text-sm mt-1">{errors.body}</p>
        {/if}
      </div>

      <!-- 发布按钮 -->
      <div>
        <button
          onclick={handleSubmit}
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={!user?._id}
        >
          {submitButtonText}
        </button>
      </div>
    </div>
  {/if}
</div>