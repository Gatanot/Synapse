<!-- 新建文章页面 -->
<script lang="ts">
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  
  let { data } = $props();
</script>

<ArticleForm
  user={data.user}
  submitHandler={async (articleData) => {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });
    const result = await response.json();
    if (response.ok) return `文章发布成功！ID: ${result.article_id}`;
    throw new Error(result.message || "发布失败");
  }}
/>