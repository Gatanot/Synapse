<!-- todo:
逻辑:接受传入的用户信息(id,name,email,article)
界面:文章编辑页面,用户可以在此处编辑文章(包括标题,简介,标签(字符串数组),正文,),发布文章
样式:待定 -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // 接收传入的用户信息和可能的文章数据
  export let data = { user: { id: '', name: '', email: '' }, article: null };

  // 表单数据
  let title = '';
  let summary = '';
  let tags = [];
  let body = '';
  let tagInput = ''; // 临时输入的标签
  let errorMessage = '';
  let successMessage = '';

  // 表单错误字段
  let errors = {
    title: '',
    summary: '',
    tags: '',
    body: ''
  };

  // 处理标签输入（按回车添加）
  function handleTagInput(event) {
    if (event.key === 'Enter' && tagInput.trim()) {
      if (tags.length >= 10) {
        errors.tags = '最多只能添加10个标签';
        return;
      }
      if (tags.includes(tagInput.trim())) {
        errors.tags = '标签不能重复';
        return;
      }
      tags = [...tags, tagInput.trim()];
      tagInput = '';
      errors.tags = '';
    }
  }

  // 删除标签
  function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    errors.tags = '';
  }

  // 提交文章
  async function submitArticle() {
    // 重置错误和成功消息
    errors = { title: '', summary: '', tags: '', body: '' };
    errorMessage = '';
    successMessage = '';

    // 客户端验证
    if (!title.trim()) {
      errors.title = '标题不能为空';
      return;
    }
    if (title.length > 200) {
      errors.title = '标题不能超过200个字符';
      return;
    }
    if (!summary.trim()) {
      errors.summary = '简介不能为空';
      return;
    }
    if (summary.length > 500) {
      errors.summary = '简介不能超过500个字符';
      return;
    }
    if (tags.length === 0) {
      errors.tags = '请至少添加一个标签';
      return;
    }
    if (!body.trim()) {
      errors.body = '正文不能为空';
      return;
    }

    // 构造请求数据
    const articleData = {
      title: title.trim(),
      summary: summary.trim(),
      tags,
      body: body.trim(),
      status: 'published'
    };

    try {
      const response = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        successMessage = '文章发布成功！文章ID: ' + result.article_id;
        // 清空表单
        title = '';
        summary = '';
        tags = [];
        body = '';
        tagInput = '';
      } else {
        errorMessage = result.message || '发布失败，请检查输入。';
        if (result.field) {
          errors[result.field] = result.message;
        }
      }
    } catch (err) {
      errorMessage = '发布失败，请稍后重试。';
      console.error('Error submitting article:', err);
    }
  }

  // 如果有传入的 article 数据，预填充表单（用于编辑，当前仅占位）
  onMount(() => {
    if (data.article) {
      title = data.article.title || '';
      summary = data.article.summary || '';
      tags = data.article.tags || [];
      body = data.article.body || '';
    }
  });
</script>

<div class="container mx-auto p-4 max-w-3xl">
  {#if !data.user?.id}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      请登录以创建文章。
      <a href="/login" class="underline">去登录</a>
    </div>
  {:else}
    <h1 class="text-2xl font-bold mb-6">创建新文章</h1>

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
          on:keydown={handleTagInput}
          class="mt-1 block w-full border {errors.tags ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="输入标签后按回车添加"
        />
        <div class="mt-2 flex flex-wrap gap-2">
          {#each tags as tag}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {tag}
              <button
                type="button"
                on:click={() => removeTag(tag)}
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
          on:click={submitArticle}
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          disabled={!data.user?.id}
        >
          发布文章
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  @import 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
</style>