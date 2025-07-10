<script lang="ts">
    import { goto } from "$app/navigation";
    import ArticleCard from "$lib/components/ArticleCard.svelte";
    import Modal from "$lib/components/Modal.svelte";
    // 假设后端会通过 load 函数传递 articles
    export let data: { articles: any[] };

let articles = [...data.articles];

function toEditArticles(id: string) {
    goto(`/my/articles/${id}/edit`);
}

let showDeleteModal = false;
let pendingDeleteId: string | null = null;
let deleteLoading = false;
let deleteError = '';

function openDeleteModal(id: string) {
    pendingDeleteId = id;
    showDeleteModal = true;
    deleteError = '';
}
function closeDeleteModal() {
    showDeleteModal = false;
    pendingDeleteId = null;
    deleteLoading = false;
    deleteError = '';
}

async function confirmDeleteArticle() {
    if (!pendingDeleteId) return;
    deleteLoading = true;
    deleteError = '';
    try {
        const res = await fetch(`/api/articles?_id=${pendingDeleteId}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            articles = articles.filter(article => article._id !== pendingDeleteId);
            closeDeleteModal();
        } else {
            deleteError = result.message || '删除失败';
        }
    } catch (e) {
        deleteError = '网络错误，删除失败';
    } finally {
        deleteLoading = false;
    }
}
</script>

<h1>我的文章列表</h1>

{#if articles && articles.length > 0}
    <div class="articles-grid">
        {#each articles as article (article._id)}
            <div class="article-row">
                <ArticleCard {article} />
                <div class="article-actions">
                    <button 
                        type="button"
                        on:click={() => toEditArticles(article._id)}
                        class="edit-btn"
                    >编辑</button>
                    <button 
                        type="button"
                        on:click={() => openDeleteModal(article._id)}
                        class="delete-btn"
                    >删除</button>
                </div>
            </div>
        {/each}
    </div>

{/if}

{#if showDeleteModal}
    <Modal
        title="确认删除"
        content="确定要删除这篇文章吗？此操作不可撤销。"
        warningText={deleteError || ''}
        confirmText={deleteLoading ? '正在删除...' : '确认删除'}
        cancelText="取消"
        loading={deleteLoading}
        on:confirm={confirmDeleteArticle}
        on:cancel={closeDeleteModal}
    />
{/if}

<style>
   /* 
      设计理念: 文章网格
      - 使用 CSS Grid 实现一个响应式的网格布局。
      - `repeat(auto-fill, minmax(340px, 1fr))` 是核心：它会自动用最小宽度为 340px 的卡片填充可用空间。
        当空间不足时，会自动变为单列布局，无需媒体查询即可实现优雅的响应式效果。
      - `gap` 属性提供了统一、干净的间距。
    */
    .articles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 2rem;
    }

    /* 
      设计理念: 空状态 (Empty State)
      - 空状态是界面的一部分，需要被设计，而不仅仅是显示一行文字。
      - 遵循 “人文关怀” 原则，提示文案应友好且具有引导性。
      - 视觉上，它应该是低调的，不刺眼的。使用次要文本颜色和柔和的背景/边框。
    */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background-color: #ffffff; /* 使用与卡片相同的背景色，感觉像一个“空卡片” */
        border: 1px dashed var(--border-color); /* 虚线边框暗示这是一个占位符/待填充区域 */
        border-radius: var(--border-radius-md);
    }


    /*
      设计理念: 每行文章操作
      - .article-row 使用 flex 布局，左侧为卡片，右侧为操作按钮。
      - 按钮组竖直居中，间距适中。
    */
    .article-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem; /* 缩小卡片与按钮组的间隔 */
        margin-bottom: 0.5rem;
    }
    .article-actions {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.5rem;
        min-width: 56px; /* 更窄 */
        padding-top: 0.5rem;
    }
    .edit-btn,
    .delete-btn {
        padding: 0.5rem 1.2rem;
        border: none;
        border-radius: var(--border-radius-md);
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
    }
    .edit-btn {
        background: #ffffff;
        color: rgb(0, 0, 0);
    }
    .edit-btn:hover {
        background: #ffffff;
        color: #000000;
    }
    .delete-btn {
        background: #ffffff;
        color: #000000;
    }
    .delete-btn:hover {
        background: #ffffff;
        color: #000000;
    }
</style>
