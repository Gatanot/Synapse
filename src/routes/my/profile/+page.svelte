<script lang="ts">
    import { enhance } from '$app/forms';
    import type { PageData, ActionData } from './$types';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    // 编辑状态
    let isEditing = $state(false);
    
    // 显示的用户数据（可变）
    let displayUser = $state({
        name: data.user.name,
        email: data.user.email
    });

    // 表单数据
    let formData = $state({
        name: data.user.name
    });

    // 表单提交状态
    let isSubmitting = $state(false);
    
    // 成功消息显示状态
    let showSuccessMessage = $state(false);
    let successMessage = $state('');

    // 监听表单结果变化
    $effect(() => {
        if (form?.success) {
            console.log('Form success detected in effect');
            showSuccessMessage = true;
            successMessage = form.message || '更新成功';
            
            // 3秒后隐藏成功消息
            setTimeout(() => {
                showSuccessMessage = false;
            }, 3000);
        }
    });

    // 当页面数据变化时，同步更新本地状态
    $effect(() => {
        displayUser.name = data.user.name;
        displayUser.email = data.user.email;
        formData.name = data.user.name;
    });

    // 开始编辑
    function startEditing() {
        isEditing = true;
        // 重置表单数据为当前显示的数据
        formData = {
            name: displayUser.name
        };
    }

    // 取消编辑
    function cancelEditing() {
        isEditing = false;
        // 重置表单数据
        formData = {
            name: displayUser.name
        };
    }

    // 表单提交处理
    function handleSubmit() {
        isSubmitting = true;
        return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
            await update();
            isSubmitting = false;
            
            console.log('Form submission result:', result);
            
            // 如果提交成功，更新显示数据
            if (result.type === 'success' && result.data?.success) {
                console.log('Success detected, updating UI');
                displayUser.name = formData.name;
                isEditing = false;
            }
        };
    }
</script>

<main>
    <div class="profile-container">
        <header class="profile-header">
            <h1>我的资料</h1>
            <p class="profile-subtitle">管理您的个人信息</p>
        </header>

        <div class="profile-card">
            {#if !isEditing}
                <!-- 查看模式 -->
                <div class="profile-view">
                    <div class="profile-field">
                        <div class="field-label">用户名</div>
                        <div class="field-value">{displayUser.name}</div>
                    </div>
                    
                    <div class="profile-field">
                        <div class="field-label">邮箱地址</div>
                        <div class="field-value">{displayUser.email}</div>
                    </div>

                    <div class="profile-actions">
                        <button 
                            onclick={startEditing}
                            class="btn-primary"
                        >
                            编辑资料
                        </button>
                    </div>
                </div>
            {:else}
                <!-- 编辑模式 -->
                <form 
                    method="POST" 
                    action="?/updateProfile"
                    use:enhance={handleSubmit}
                    class="profile-form"
                >
                    <div class="form-field">
                        <label for="name" class="field-label">用户名</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            bind:value={formData.name}
                            required
                            minlength="2"
                            maxlength="50"
                            class="form-input"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div class="form-field">
                        <div class="field-label">邮箱地址</div>
                        <div class="field-value readonly">{displayUser.email}</div>
                        <div class="field-note">邮箱地址不可修改</div>
                    </div>

                    <div class="form-actions">
                        <button 
                            type="submit" 
                            class="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '保存中...' : '保存'}
                        </button>
                        <button 
                            type="button" 
                            onclick={cancelEditing}
                            class="btn-secondary"
                            disabled={isSubmitting}
                        >
                            取消
                        </button>
                    </div>
                </form>
            {/if}
        </div>

        <!-- 消息提示 -->
        {#if form?.error}
            <div class="message error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {form.error}
            </div>
        {/if}

        {#if showSuccessMessage}
            <div class="message success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                {successMessage}
            </div>
        {/if}
    </div>
</main>

<style>
    /* === 基础布局 === */
    main {
        display: flex;
        justify-content: center;
        padding: 2rem 1rem;
        min-height: 100vh;
        background-color: var(--background);
    }

    .profile-container {
        width: 100%;
        max-width: 600px;
    }

    /* === 页面头部 === */
    .profile-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .profile-header h1 {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
    }

    .profile-subtitle {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin: 0;
    }

    /* === 资料卡片 === */
    .profile-card {
        background-color: var(--surface-bg);
        border-radius: var(--border-radius-md);
        padding: 2.5rem;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--border-color);
    }

    /* === 查看模式样式 === */
    .profile-view {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .profile-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .field-value {
        font-size: 1.125rem;
        color: var(--text-primary);
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);
    }

    .field-value.readonly {
        background-color: var(--background);
        padding: 0.75rem 1rem;
        border-radius: var(--border-radius-md);
        border: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        opacity: 0.8;
    }

    .field-note {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-style: italic;
        margin-top: 0.25rem;
    }

    /* === 编辑模式样式 === */
    .profile-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        font-size: 1rem;
        color: var(--text-primary);
        background-color: var(--surface-bg);
        transition: 
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
    }

    .form-input:focus {
        outline: none;
        border-color: var(--text-primary);
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    .form-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* === 按钮样式 === */
    .profile-actions,
    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .btn-primary {
        background-color: var(--text-primary);
        color: var(--surface-bg);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius-md);
        font-weight: 600;
        cursor: pointer;
        transition:
            background-color var(--transition-speed) ease,
            transform var(--transition-speed) ease;
        flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #000;
        transform: translateY(-1px);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .btn-secondary {
        background-color: var(--background);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius-md);
        font-weight: 600;
        cursor: pointer;
        transition:
            background-color var(--transition-speed) ease,
            color var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
        flex: 1;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: var(--hover-bg);
        color: var(--text-primary);
        border-color: var(--text-primary);
    }

    .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* === 消息提示 === */
    .message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: var(--border-radius-md);
        margin-top: 1.5rem;
        font-weight: 500;
    }

    .error-message {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    .success-message {
        background-color: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
    }

    .message svg {
        flex-shrink: 0;
    }

    /* === 响应式设计 === */
    @media (max-width: 768px) {
        main {
            padding: 1rem;
        }

        .profile-card {
            padding: 1.5rem;
        }

        .profile-header h1 {
            font-size: 2rem;
        }

        .form-actions,
        .profile-actions {
            flex-direction: column;
        }

        .btn-primary,
        .btn-secondary {
            flex: none;
        }
    }
</style>