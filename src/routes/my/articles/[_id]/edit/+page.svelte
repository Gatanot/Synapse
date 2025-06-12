<!-- 接受文章信息,完成文章编写界面
将之前已完成的文章编辑界面提取为一个文章编辑组件保存在 src/lib/components
并在所有地方使用该组件 
-->
<script lang="ts">
  import ArticleCard from "$lib/components/ArticleCard.svelte";
  import { onMount } from "svelte";
  import type {ArticleClient} from "$lib/types/client";

  // 定义表单错误接口
  interface FormErrors {
    title: string; // 标题错误信息
    summary: string; // 简介错误信息
    tags: string; // 标签错误信息
    body: string; // 正文错误信息
  }

  // 接收后端数据
  let {data} =$props();

  // 表单数据
  let title: string =$state(""); // 文章标题
  let summary: string = $state(""); // 文章简介
  let tags: string[] =  $state([]); // 标签数组
  let body: string =  $state(""); // 文章正文
  let tagInput: string =  $state(""); // 临时输入的标签
  let errorMessage: string =  $state(""); // 错误提示
  let successMessage: string =  $state(""); // 成功提示

  // 表单错误字段
  let errors: FormErrors = {
    title: "",
    summary: "",
    tags: "",
    body: "",
  };


 

  // 处理标签输入（按回车添加）
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

  // 更新文章
  async function updateArticle(): Promise<void> {
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
      // 调试：记录请求数据
  
      const response = await fetch(`/api/articles/${data.articletoclient._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        successMessage = `文章更新成功！文章ID: ${data.articletoclient._id}`;
       
      } else {
        errorMessage = result.message || "更新失败，请检查输入。";
        if (result.field) {
          errors[result.field as keyof FormErrors] = result.message;
        }
      }
    } catch (err) {
      errorMessage = "更新失败，请稍后重试。";
      console.error("Error updating article:", err);
    }
  }

  // 预填充表单数据
  onMount(() => {
    
    if (data.articletoclient) {
      title = data.articletoclient.title || "";
      summary = data.articletoclient.summary || "";
      tags = data.articletoclient.tags || [];
      body = data.articletoclient.body || "";
    }
  });
</script>



  <p class="text-gray-700 mb-4">文章 ID: {data.articletoclient._id}</p>

  <div class="container mx-auto p-4 max-w-3xl">
  <h1 class="text-2xl font-bold mb-6">编辑文章</h1>

  <!-- 错误提示 -->
  {#if errorMessage}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      {errorMessage}
    </div>
  {/if}

  
  <!-- 成功提示 -->
  {#if successMessage}
    <div
      class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
    >
      {successMessage}
    </div>
  {/if}

  <!-- 表单 -->
  <div class="space-y-4">
    <!-- 标题 -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700"
        >标题</label
      >
      <input
        type="text"
        id="title"
        bind:value={title}
        class="mt-1 block w-full border {errors.title
          ? 'border-red-500'
          : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="请输入文章标题"
        maxlength="200"
      />
      {#if errors.title}
        <p class="text-red-500 text-sm mt-1">{errors.title}</p>
      {/if}
    </div>

    <!-- 简介 -->
    <div>
      <label for="summary" class="block text-sm font-medium text-gray-700"
        >简介</label
      >
      <textarea
        id="summary"
        bind:value={summary}
        class="mt-1 block w-full border {errors.summary
          ? 'border-red-500'
          : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
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
      <label for="tags" class="block text-sm font-medium text-gray-700"
        >标签</label
      >
      <input
        type="text"
        id="tags"
        bind:value={tagInput}
        onkeydown={handleTagInput}
        class="mt-1 block w-full border {errors.tags
          ? 'border-red-500'
          : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="输入标签后按回车添加"
      />
      <div class="mt-2 flex flex-wrap gap-2">
        {#each tags as tag}
          <span
            class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
          >
            {tag}
            <button
              type="button"
              onclick={() => removeTag(tag)}
              class="ml-1 text-indigo-600 hover:text-indigo-800"
            >
              ×
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
      <label for="body" class="block text-sm font-medium text-gray-700"
        >正文 (Markdown)</label
      >
      <textarea
        id="body"
        bind:value={body}
        class="mt-1 block w-full border {errors.body
          ? 'border-red-500'
          : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="请输入文章正文 (支持Markdown)"
        rows="10"
      ></textarea>
      {#if errors.body}
        <p class="text-red-500 text-sm mt-1">{errors.body}</p>
      {/if}
    </div>
    
  
    <!-- 提交按钮 -->
    <div>
      <button
        onclick={updateArticle}
        class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
      >
        保存更新
      </button>
    </div>
  </div>
</div>

<style>
 
</style>