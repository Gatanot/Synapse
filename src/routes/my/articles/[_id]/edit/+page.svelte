<script lang="ts">
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  
  // 获取路由参数和加载的数据
  let { data } = $props<{
    data: {
      articletoclient: {
        _id: string;
        title: string;
        summary: string;
        tags: string[];
        body: string;
      };
      user: {
        _id: string;
        name?: string;
        email?: string;
      };
    };
  }>();

  // 更新文章的处理函数
  async function handleUpdate(articleData: any): Promise<string> {
    const response = await fetch(`/api/articles/${data.articletoclient._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData)
    });

    const result = await response.json();

    if (response.ok) {
      return `文章更新成功！ID: ${data.articletoclient._id}`;
    } else {
      throw new Error(result.message || "更新失败");
    }
  }
</script>

<ArticleForm
  user={data.user}
  initialArticle={data.articletoclient}
  submitHandler={handleUpdate}
  formTitle="编辑文章"
  submitButtonText="保存更新"
  articleId={data.articletoclient._id}
/>