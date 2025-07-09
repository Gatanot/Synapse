<script lang="ts">
  import ArticleForm from "$lib/components/ArticleForm.svelte";
  import { goto } from "$app/navigation";
  
  let { data } = $props();

  // 保存草稿的处理函数
  async function saveDraftHandler(articleData: any) {
    const response = await fetch(`/api/drafts/${data.draft._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...articleData,
        status: 'draft' // 确保保存为草稿
      })
    });
    
    const result = await response.json();
    if (response.ok) {
      return "草稿保存成功！";
    }
    throw new Error(result.message || "保存失败");
  }

  // 发布草稿的处理函数  
  async function publishHandler(articleData: any) {
    // 先保存草稿
    try {
      await saveDraftHandler(articleData);
    } catch (e) {
      throw new Error("保存草稿失败，无法发布");
    }

    // 然后发布
    const response = await fetch(`/api/drafts/${data.draft._id}/publish`, {
      method: "POST"
    });
    
    const result = await response.json();
    if (response.ok) {
      // 发布成功后跳转到文章页面
      setTimeout(() => {
        goto(`/articles/${data.draft._id}`);
      }, 1000);
      return "文章发布成功！正在跳转...";
    }
    throw new Error(result.message || "发布失败");
  }

  function goBack() {
    goto('/my/drafts');
  }
</script>

<svelte:head>
    <title>编辑草稿 - {data.draft.title} - Synapse</title>
    <meta name="description" content="编辑您的文章草稿" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <div class="header-actions">
            <button type="button" onclick={goBack} class="back-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
                返回草稿列表
            </button>
        </div>
        <h1>编辑草稿</h1>
        <div class="draft-info">
            <span class="draft-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                草稿状态
            </span>
            <span class="last-updated">
                最后更新：{data.draft.updatedAt ? new Date(data.draft.updatedAt).toLocaleString('zh-CN') : '未知'}
            </span>
        </div>
    </section>

    <div class="form-container">
        <ArticleForm
            user={data.user}
            initialArticle={data.draft}
            submitHandler={publishHandler}
            draftHandler={saveDraftHandler}
            showDraftButton={true}
            submitButtonText="发布文章"
            formTitle=""
            articleId={data.draft._id}
        />
    </div>
</main>

<style>
    /* 页面头部样式 */
    .page-header {
        margin-bottom: 2rem;
    }

    .header-actions {
        margin-bottom: 1rem;
    }

    .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #f5f5f5;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-sm);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all var(--transition-speed) ease;
    }

    .back-btn:hover {
        background-color: #e0e0e0;
        color: var(--text-primary);
    }

    .back-btn svg {
        width: 1rem;
        height: 1rem;
    }

    .page-header h1 {
        margin: 0 0 1rem 0;
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .draft-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .draft-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.75rem;
        background-color: rgba(255, 255, 255, 0.1);
        color: #000000;
        border-radius: var(--border-radius-sm);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .draft-badge svg {
        width: 1rem;
        height: 1rem;
    }

    .last-updated {
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    /* 表单容器 */
    .form-container {
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        padding: 2rem;
    }

    /* 移动端响应式 */
    @media (max-width: 768px) {
        .draft-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .form-container {
            padding: 1rem;
        }
    }
</style>
