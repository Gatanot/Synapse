<!-- 新建文章页面 -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  
  let { data } = $props();

  // 发布文章处理函数
  async function publishHandler(articleData: any) {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });
    const result = await response.json();
    if (response.ok) {
      // 发布成功后跳转到新发布的文章页面
      const articleId = result.article_id;
      goto(`/articles/${articleId}`);
      return `文章发布成功！正在跳转到文章页面...`;
    }
    throw new Error(result.message || "发布失败");
  }

  // 保存草稿处理函数
  async function saveDraftHandler(draftData: any) {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draftData,
        status: 'draft'
      })
    });
    const result = await response.json();
    if (response.ok) {
      // 保存草稿成功后跳转到草稿页面
      const draftId = result.article_id;
      goto(`/my/drafts`);
      return `草稿保存成功！正在跳转到草稿页面...`;
    }
    throw new Error(result.message || "保存草稿失败");
  }
</script>

<ArticleForm
  user={data.user}
  submitHandler={publishHandler}
  draftHandler={saveDraftHandler}
  showDraftButton={true}
  submitButtonText="发布文章"
  formTitle="创建文章"
/>