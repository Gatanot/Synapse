<!-- src/lib/components/CommentForm.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CommentForm } from "$lib/types/share";

    const dispatch = createEventDispatcher<{
        submit: { content: string };
        cancel: void;
    }>();

    // 表单数据
    let formData: CommentForm = $state({
        content: "",
    });

    // 表单状态
    let isSubmitting = $state(false);
    let error = $state("");

    // 字符计数
    const maxLength = 1000;
    let remainingChars = $derived(maxLength - formData.content.length);

    // 表单验证
    let isValid = $derived(
        formData.content.trim().length > 0 &&
            formData.content.length <= maxLength,
    );

    // 提交表单
    async function handleSubmit(event?: Event) {
        if (event) event.preventDefault();
        if (!isValid || isSubmitting) return;

        error = "";
        isSubmitting = true;
        dispatch("submit", { content: formData.content.trim() });
    }

    // 取消评论
    function handleCancel() {
        formData.content = "";
        error = "";
        dispatch("cancel");
    }

    // 处理键盘事件
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleSubmit();
        }
    }

    // 添加一个清空表单的公共方法供父组件调用
    export function clearForm() {
        formData.content = "";
        error = "";
        isSubmitting = false;
    }

    // 添加一个设置错误状态的公共方法
    export function setError(errorMessage: string) {
        error = errorMessage;
        isSubmitting = false;
    }
</script>

<div class="comment-form-container">
    <form class="comment-form" onsubmit={handleSubmit}>
        <div class="form-header">
            <h3>发表评论</h3>
        </div>

        <div class="form-body">
            <div class="form-group">
                <label for="comment-content" class="visually-hidden">
                    评论内容
                </label>
                <textarea
                    id="comment-content"
                    bind:value={formData.content}
                    onkeydown={handleKeydown}
                    class="form-textarea"
                    class:is-error={error || remainingChars < 0}
                    placeholder="写下你的想法..."
                    rows="5"
                    disabled={isSubmitting}
                    maxlength={maxLength}
                ></textarea>
            </div>
            
            <div class="form-footer">
                <div class="form-hint">
                    Ctrl+Enter 快速提交
                </div>
                <div
                    class="char-count"
                    class:warning={remainingChars < 50 && remainingChars >= 0}
                    class:error={remainingChars < 0}
                >
                    {formData.content.length} / {maxLength}
                </div>
            </div>

            {#if error}
                <div class="alert alert-error">{error}</div>
            {/if}

            <div class="form-actions">
                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick={handleCancel}
                    disabled={isSubmitting}
                >
                    取消
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={!isValid || isSubmitting}
                >
                    {#if isSubmitting}
                        <span class="spinner"></span> 发布中...
                    {:else}
                        发布评论
                    {/if}
                </button>
            </div>
        </div>
    </form>
</div>

<style>
    :root {
        --warning-color: #f57c00; /* 定义一个警告色 */
    }
    
    .comment-form-container {
        margin-top: 3rem;
    }
    
    .comment-form {
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        overflow: hidden; 
    }

    .form-header {
        padding: 1rem 1.5rem;
        background-color: var(--background); 
        border-bottom: 1px solid var(--border-color);
    }
    .form-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .form-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
    }

    .form-textarea {
        width: 100%;
        /* 核心修复 */
        box-sizing: border-box; 
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        font-size: 1rem;
        font-family: inherit;
        color: var(--text-primary);
        outline: none;
        transition: 
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
        line-height: 1.7;
        resize: vertical;
    }
    .form-textarea:focus {
        border-color: var(--highlight-color);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--highlight-color) 20%, transparent);
    }
    .form-textarea.is-error {
        border-color: var(--error-color, #d32f2f);
    }
    .form-textarea.is-error:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--error-color, #d32f2f) 25%, transparent);
    }

    .form-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
    }
    .form-hint {
        color: var(--text-secondary);
    }
    .char-count {
        color: var(--text-secondary);
        font-weight: 500;
        transition: color var(--transition-speed) ease;
    }
    .char-count.warning {
        color: var(--warning-color);
    }
    .char-count.error {
        color: var(--error-color, #d32f2f);
    }
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.6rem 1.25rem;
        border: 1px solid transparent;
        border-radius: var(--border-radius-md);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-speed) ease;
    }
    .btn-primary {
        background-color: var(--text-primary);
        color: white;
    }
    .btn-primary:hover:not(:disabled) {
        background-color: #424242;
    }
    .btn-secondary {
        background-color: transparent;
        color: var(--text-secondary);
    }
    .btn-secondary:hover:not(:disabled) {
        background-color: var(--hover-bg);
        color: var(--text-primary);
    }
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .alert {
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius-md);
        border: 1px solid transparent;
    }
    .alert.alert-error {
        background-color: var(--error-bg, #ffebee);
        color: var(--error-color, #d32f2f);
        border-color: color-mix(in srgb, var(--error-color, #d32f2f) 40%, transparent);
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spinner {
        display: inline-block;
        width: 1em;
        height: 1em;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }
</style>