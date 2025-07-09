<script lang="ts">
  // --- Script部分保持不变 ---
  import { onMount } from "svelte";

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
    articleId = undefined,
    draftHandler = undefined,
    showDraftButton = false,
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
    draftHandler?: (articleData: any) => Promise<string>;
    showDraftButton?: boolean;
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
      event.preventDefault(); // 阻止回车提交表单
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
    tags = tags.filter((tag: string) => tag !== tagToRemove);
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

  // 保存草稿
  async function handleSaveDraft(): Promise<void> {
    if (!draftHandler) return;

    // 重置错误和成功消息
    errors = { title: "", summary: "", tags: "", body: "" };
    errorMessage = "";
    successMessage = "";

    // 草稿的验证更宽松，只要有内容就可以保存
    if (!title.trim() && !summary.trim() && !body.trim()) {
      errorMessage = "请至少填写标题、简介或正文中的一项";
      return;
    }

    // 构造草稿数据
    const draftData = {
      title: title.trim() || "无标题草稿",
      summary: summary.trim() || "暂无简介",
      tags: tags.length > 0 ? tags : ["草稿"],
      body: body.trim() || "",
      status: "draft",
    };

    try {
      const message = await draftHandler(draftData);
      successMessage = message;
    } catch (err: any) {
      errorMessage = err.message || "保存草稿失败，请稍后重试。";
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

<!-- HTML结构已更新，移除了原子化class，换上了语义化的class -->
<div class="article-form-container">
  {#if !user?._id}
    <div class="alert alert-info">
      请登录以创建文章。
      <a href="/login">去登录</a>
    </div>
  {:else}
    <h1>{formTitle}</h1>
    
    <!-- 提示信息 -->
    {#if errorMessage}
      <div class="alert alert-error">{errorMessage}</div>
    {/if}
    {#if successMessage}
      <div class="alert alert-success">{successMessage}</div>
    {/if}

    <!-- 表单 -->
    <div class="form-body">
      <!-- 标题 -->
      <div class="form-group">
        <label for="title">标题</label>
        <input
          type="text"
          id="title"
          bind:value={title}
          class="form-input"
          class:is-error={errors.title}
          placeholder="请输入文章标题"
          maxlength="200"
        />
        {#if errors.title}
          <p class="error-message">{errors.title}</p>
        {/if}
      </div>

      <!-- 简介 -->
      <div class="form-group">
        <label for="summary">简介</label>
        <textarea
          id="summary"
          bind:value={summary}
          class="form-input"
          class:is-error={errors.summary}
          placeholder="请输入文章简介"
          rows="3"
          maxlength="500"
        ></textarea>
        {#if errors.summary}
          <p class="error-message">{errors.summary}</p>
        {/if}
      </div>

      <!-- 标签 -->
      <div class="form-group">
        <label for="tags">标签 (输入后按回车添加)</label>
        <input
          type="text"
          id="tags"
          bind:value={tagInput}
          onkeydown={handleTagInput}
          class="form-input"
          class:is-error={errors.tags}
        />
        <div class="tag-list">
          {#each tags as tag}
            <span class="tag">
              {tag}
              <button
                type="button"
                class="remove-tag"
                onclick={() => removeTag(tag)}
                aria-label="移除标签 {tag}"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
        {#if errors.tags}
          <p class="error-message">{errors.tags}</p>
        {/if}
      </div>

      <!-- 正文 -->
      <div class="form-group">
        <label for="body">正文 (支持Markdown)</label>
        <textarea
          id="body"
          bind:value={body}
          class="form-input"
          class:is-error={errors.body}
          rows="15"
        ></textarea>
        {#if errors.body}
          <p class="error-message">{errors.body}</p>
        {/if}
      </div>

      <!-- 发布按钮 -->
      <div class="form-actions">
        {#if showDraftButton && draftHandler}
          <button
            onclick={handleSaveDraft}
            class="draft-btn"
            disabled={!user?._id}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            保存草稿
          </button>
        {/if}
        <button
          onclick={handleSubmit}
          class="submit-btn"
          disabled={!user?._id}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
          </svg>
          {submitButtonText}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
    /* 
      设计理念: 延续已有设计体系
      - 使用CSS变量，保持颜色、圆角、过渡等基础元素统一。
      - 遵循 “内容优先” 和 “克制的视觉语言” 原则。
      - 表单是功能性区域，样式应清晰、无干扰，并提供明确的反馈。
    */
    :root {
        /* 定义特定于表单的颜色变量，便于管理 */
        --error-color: #d32f2f;
        --error-bg: #ffebee;
        --success-color: #388e3c;
        --success-bg: #e8f5e9;
        --info-color: #0288d1;
        --info-bg: #e1f5fe;
    }

    .article-form-container {
        /* 与 main-content 保持一致的布局 */
        max-width: 800px;
        margin: 0 auto;
    }

    .article-form-container h1 {
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 1rem;
    }

    .form-body {
        display: flex;
        flex-direction: column;
        gap: 2rem; /* 表单组之间有足够的间距 */
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem; /* 标签和输入框之间的间距 */
    }

    .form-group label {
        font-weight: 500;
        color: var(--text-primary);
    }

    /* 
      设计理念: 输入框样式统一
      - 与导航栏的搜索框共享视觉语言：圆角、边框、内边距和焦点效果。
      - 这是系统一致性的关键体现。
    */
    .form-input {
        width: 100%;
        box-sizing: border-box; /* 确保padding和border包含在width内 */
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff; /* 表单输入框使用纯白背景 */
        font-size: 1rem;
        font-family: inherit;
        color: var(--text-primary);
        outline: none;
        transition: 
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
    }

    .form-input::placeholder {
        color: var(--text-secondary);
        font-style: italic;
    }

    /* 
      设计理念: 清晰的焦点反馈 (与搜索框一致)
      - 使用 `box-shadow` 创造辉光效果，而不是丑陋的默认 `outline`。
    */
    .form-input:focus {
        border-color: var(--highlight-color);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--highlight-color) 20%, transparent);
    }
    
    textarea.form-input {
        line-height: 1.7; /* 提升长文本输入体验，体现人文关怀 */
        resize: vertical; /* 允许用户垂直调整大小 */
    }

    /* 
      设计理念: 标签样式统一
      - 复用 `ArticleCard` 中的标签(chip)样式，确保视觉一致性。
      - 移除按钮提供了清晰的交互。
    */
    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .tag {
        display: inline-flex; /* 使用 inline-flex 使内部按钮对齐 */
        align-items: center;
        gap: 0.5rem;
        background-color: var(--background);
        color: var(--text-secondary);
        padding: 0.25rem 0.75rem;
        border-radius: var(--border-radius-md);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .remove-tag {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 1.25rem;
        line-height: 1;
        border-radius: 50%;
        transition: 
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }
    .remove-tag:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }

    /* 
      设计理念: 明确的错误状态
      - 错误状态是重要的用户反馈，应清晰但不刺眼。
      - 使用变量 `--error-color` 来统一样式。
    */
    .form-input.is-error {
        border-color: var(--error-color);
    }
    .form-input.is-error:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--error-color) 25%, transparent);
    }

    .error-message {
        color: var(--error-color);
        font-size: 0.875rem;
    }

    /*
      设计理念: 表单操作区域
      - 按钮组布局，提供清晰的操作层级
      - 草稿按钮为次要操作，发布按钮为主要操作
    */
    .form-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: flex-end;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    /*
      设计理念: 草稿按钮
      - 次要操作按钮，视觉层级低于主要的发布按钮
      - 使用较浅的背景色和边框，表示这是一个辅助功能
    */
    .draft-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        color: var(--text-secondary);
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-speed) ease;
    }

    .draft-btn:hover {
        background-color: var(--hover-bg);
        color: var(--text-primary);
        border-color: var(--text-secondary);
    }

    .draft-btn:disabled {
        background-color: var(--hover-bg);
        color: var(--text-secondary);
        border-color: var(--border-color);
        cursor: not-allowed;
        opacity: 0.6;
    }

    .draft-btn svg,
    .submit-btn svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    /*
      设计理念: 主操作按钮
      - 与导航栏的 "注册" 按钮样式完全一致，代表这是一个主要的、积极的操作。
    */
    .submit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 2rem;
        border: none;
        border-radius: var(--border-radius-md);
        background-color: var(--text-primary);
        color: white;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color var(--transition-speed) ease;
    }

    .submit-btn:hover {
        background-color: #424242; /* 深色按钮的悬停效果，与注册按钮一致 */
    }

    .submit-btn:disabled {
        background-color: var(--hover-bg);
        color: var(--text-secondary);
        cursor: not-allowed;
    }

    /* 
      设计理念: 提示信息框 (Alerts)
      - 提供清晰、一致的反馈。
      - 使用柔和的背景色和更深的主题色文本，易于辨识但不过于分散注意力。
    */
    .alert {
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        border-radius: var(--border-radius-md);
        border: 1px solid transparent;
    }
    .alert.alert-error {
        background-color: var(--error-bg);
        color: var(--error-color);
        border-color: color-mix(in srgb, var(--error-color) 40%, transparent);
    }
    .alert.alert-success {
        background-color: var(--success-bg);
        color: var(--success-color);
        border-color: color-mix(in srgb, var(--success-color) 40%, transparent);
    }
    .alert.alert-info {
        background-color: var(--info-bg);
        color: var(--info-color);
        border-color: color-mix(in srgb, var(--info-color) 40%, transparent);
    }
    .alert a {
        color: inherit;
        font-weight: 500;
        text-decoration: underline;
    }
</style>