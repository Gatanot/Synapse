<!-- 新建文章页面 -->
<script lang="ts">
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
    if (response.ok) return `文章发布成功！ID: ${result.article_id}`;
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
    if (response.ok) return `草稿保存成功！ID: ${result.article_id}`;
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