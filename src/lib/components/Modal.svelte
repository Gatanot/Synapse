<!--
    Modal.svelte - 通用弹窗组件
    
    可定制的弹窗组件，支持以下功能：
    - 标题与内容自定义
    - 可选的警告文本
    - 确认和取消按钮
    - 可自定义按钮文本
    - 可选的表单提交功能
    - 键盘Escape关闭
    - 动画效果
    
    使用示例：
    ```svelte
    <script>
        import Modal from '$lib/components/Modal.svelte';
        
        let showModal = false;
        
        function handleConfirm() {
            // 处理确认逻辑
            showModal = false;
        }
    </script>
    
    <button on:click={() => showModal = true}>显示弹窗</button>
    
    {#if showModal}
        <Modal
            title="确认操作"
            content="您确定要执行此操作吗？"
            warningText="此操作不可撤销。"
            confirmText="确定"
            cancelText="取消"
            on:confirm={handleConfirm}
            on:cancel={() => showModal = false}
        />
    {/if}
    ```
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';

    // 弹窗属性
    export let title: string = ''; // 弹窗标题
    export let content: string = ''; // 弹窗内容
    export let warningText: string = ''; // 警告文本（可选）
    export let confirmText: string = '确定'; // 确认按钮文本
    export let cancelText: string = '取消'; // 取消按钮文本
    export let loading: boolean = false; // 加载状态
    export let loadingText: string = '处理中...'; // 加载状态时的按钮文本
    export let formAction: string = ''; // 表单提交的action（可选）
    export let formData: Record<string, string> = {}; // 表单提交的数据（可选）
    export let useEnhance: boolean = false; // 是否使用enhance增强表单（可选）
    export let width: string = 'auto'; // 弹窗宽度，可以是auto或具体值
    export let alignText: string = 'center'; // 文本对齐方式: 'left', 'center', 'right'
    export let escapeToClose: boolean = true; // 是否允许使用Escape键关闭弹窗

    // 事件派发器
    const dispatch = createEventDispatcher();

    // 处理确认事件
    function handleConfirm() {
        dispatch('confirm');
    }

    // 处理取消事件
    function handleCancel() {
        dispatch('cancel');
    }

    // 处理背景点击事件
    function handleBackdropClick(event: MouseEvent) {
        // 只有当点击的是背景层时才关闭弹窗
        if (event.target === event.currentTarget) {
            dispatch('cancel');
        }
    }

    // 处理键盘事件
    function handleKeydown(event: KeyboardEvent) {
        if (escapeToClose && event.key === 'Escape') {
            dispatch('cancel');
        }
    }

    // 当表单使用enhance增强时的处理函数
    function enhanceForm() {
        dispatch('beforeSubmit');
        return async ({ update }: { update: () => Promise<void> }) => {
            await update();
            dispatch('afterSubmit');
        };
    }
</script>

<div 
    class="modal-mask" 
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <div 
        class="modal-dialog"
        role="document"
        style="width: {width}; text-align: {alignText};"
    >
        {#if title}
            <div class="modal-title">{title}</div>
        {/if}
        
        <div class="modal-content">
            {#if content}
                {@html content.replace(/\n/g, '<br>')}
            {/if}
            <slot name="content"></slot>
            
            {#if warningText}
                <span class="warning-text">{warningText}</span>
            {/if}
        </div>
        
        <div class="modal-actions">
            {#if formAction}
                <form 
                    method="post" 
                    action={formAction}
                    use:enhance={useEnhance ? enhanceForm : undefined}
                >
                    {#each Object.entries(formData) as [name, value]}
                        <input type="hidden" {name} {value} />
                    {/each}
                    
                    <slot name="form-fields"></slot>
                    
                    <button 
                        class="btn-primary" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? loadingText : confirmText}
                    </button>
                    
                    <button type="button" class="btn-secondary" on:click={handleCancel}>
                        {cancelText}
                    </button>
                </form>
            {:else}
                <button 
                    class="btn-primary" 
                    type="button"
                    on:click={handleConfirm}
                    disabled={loading}
                >
                    {loading ? loadingText : confirmText}
                </button>
                
                <button type="button" class="btn-secondary" on:click={handleCancel}>
                    {cancelText}
                </button>
            {/if}
            
            <slot name="actions"></slot>
        </div>
        
        <slot></slot>
    </div>
</div>

<style>
    /* 弹窗样式 */
    .modal-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.25);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-dialog {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
        padding: 2rem 2.5rem 1.5rem 2.5rem;
        min-width: 280px;
        max-width: 90vw;
        animation: modalIn 0.18s cubic-bezier(0.4, 1.6, 0.6, 1) both;
    }

    @keyframes modalIn {
        from { 
            transform: scale(0.95) translateY(30px); 
            opacity: 0; 
        }
        to { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
        }
    }

    .modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #212121;
    }

    .modal-content {
        color: #757575;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .warning-text {
        color: #f44336;
        font-weight: 500;
        display: block;
        margin-top: 0.5rem;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .btn-primary {
        background-color: #212121;
        color: #fff;
        border: none;
        padding: 0.6rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #000;
    }

    .btn-primary:disabled {
        background-color: #9e9e9e;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: #f5f5f5;
        color: #757575;
        border: 1px solid #e0e0e0;
        padding: 0.6rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }

    .btn-secondary:hover {
        background-color: #e0e0e0;
        color: #212121;
        border-color: #212121;
    }

    /* 响应式设计 */
    @media (max-width: 640px) {
        .modal-dialog {
            padding: 1.5rem;
            width: calc(100% - 2rem) !important;
            max-width: none;
            margin: 0 1rem;
        }

        .modal-actions {
            flex-direction: column;
        }

        .btn-primary, .btn-secondary {
            width: 100%;
            margin-bottom: 0.5rem;
        }
    }
</style>
