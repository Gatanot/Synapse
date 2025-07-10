<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import Modal from '$lib/components/Modal.svelte';

let email = '';
let code = '';
let newPassword = '';
let step = 1; // 1: 邮箱+验证码，2: 新密码
let codeSent = false;
let codeCountdown = 0;
let errorMessage: string | null = null;
let isLoading = false;

onMount(() => {
    // 如果有 query 参数自动填充邮箱
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    if (e) email = e;
});

async function handleSendCode() {
    errorMessage = null;
    if (!email || !email.includes('@')) {
        errorMessage = '请输入有效邮箱';
        return;
    }
    isLoading = true;
    try {
        const res = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, action: 'send' })
        });
        const data = await res.json();
        if (data.success) {
            codeSent = true;
            codeCountdown = 60;
            const timer = setInterval(() => {
                codeCountdown--;
                if (codeCountdown <= 0) clearInterval(timer);
            }, 1000);
        } else {
            errorMessage = data.message;
        }
    } catch (err) {
        errorMessage = '验证码发送失败，请稍后再试。';
    } finally {
        isLoading = false;
    }
}

async function handleVerifyCode() {
    errorMessage = null;
    if (!email || !code) {
        errorMessage = '请填写邮箱和验证码';
        return;
    }
    isLoading = true;
    try {
        const res = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, action: 'verify' })
        });
        const data = await res.json();
        if (data.success) {
            step = 2;
        } else {
            errorMessage = data.message;
        }
    } catch (err) {
        errorMessage = '验证码校验失败，请稍后再试。';
    } finally {
        isLoading = false;
    }
}

let showSuccessModal = false;

async function handleResetPassword() {
    errorMessage = null;
    if (!newPassword || newPassword.length < 6) {
        errorMessage = '新密码长度至少为6位';
        return;
    }
    isLoading = true;
    try {
        const res = await fetch('/password/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showSuccessModal = true;
        } else {
            errorMessage = data.message;
        }
    } catch (err) {
        errorMessage = '密码重置失败，请稍后再试。';
    } finally {
        isLoading = false;
    }
}

function gotoLogin() {
    showSuccessModal = false;
    goto('/login');
}
</script>

<svelte:head>
    <title>重设密码 - Synapse</title>
    <meta name="description" content="重设您的账户密码" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <h1>重设密码</h1>
    </section>

    <div class="reset-card">
        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}
        
        {#if step === 1}
            <div class="step-header">
                <h2>第一步：验证身份</h2>
                <p>请输入您的邮箱地址和验证码</p>
            </div>
            <div class="form-group">
                <label for="email">邮箱地址</label>
                <input 
                    id="email" 
                    type="email" 
                    bind:value={email} 
                    placeholder="请输入注册邮箱"
                    class="form-input"
                />
            </div>
            <div class="form-group">
                <label for="code">验证码</label>
                <div class="input-with-button">
                    <input 
                        id="code" 
                        type="text" 
                        bind:value={code} 
                        placeholder="请输入验证码"
                        class="form-input"
                    />
                    <button 
                        type="button" 
                        on:click={handleSendCode} 
                        disabled={codeCountdown > 0 || isLoading}
                        class="secondary-btn"
                    >
                        {codeCountdown > 0 ? `重新发送(${codeCountdown})` : '发送验证码'}
                    </button>
                </div>
            </div>
            <button 
                on:click={handleVerifyCode} 
                disabled={isLoading}
                class="primary-btn"
            >
                {isLoading ? '验证中...' : '下一步'}
            </button>
        {:else}
            <div class="step-header">
                <h2>第二步：设置新密码</h2>
                <p>请输入您的新密码（至少6位字符）</p>
            </div>
            <div class="form-group">
                <label for="newPassword">新密码</label>
                <input 
                    id="newPassword" 
                    type="password" 
                    bind:value={newPassword} 
                    placeholder="请输入新密码（至少6位）"
                    class="form-input"
                />
            </div>
            <button 
                on:click={handleResetPassword} 
                disabled={isLoading}
                class="primary-btn"
            >
                {isLoading ? '重置中...' : '重置密码'}
            </button>
        {/if}
        <div class="back-link">
            <a href="/login">返回登录页</a>
        </div>
    </div>
</main>

{#if showSuccessModal}
    <Modal
        title="密码重置成功"
        content="密码重置成功，请用新密码登录。"
        confirmText="去登录"
        cancelText="留在此页"
        on:confirm={gotoLogin}
        on:cancel={() => showSuccessModal = false}
    />
{/if}

<style>
    /* 
      设计理念: 页面头部
      - 与主站保持一致的头部设计风格
    */
    .page-header {
        margin-bottom: 2.5rem;
        text-align: center;
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    /* 
      设计理念: 重设密码卡片
      - 使用与主站相同的卡片设计风格
      - 清晰的信息层次和视觉结构
    */
    .reset-card {
        max-width: 480px;
        margin: 0 auto;
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        padding: 2.5rem;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .step-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .step-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
    }

    .step-header p {
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.5;
    }

    /* 
      设计理念: 表单组件
      - 与主站表单风格保持一致
      - 清晰的标签和输入框设计
    */
    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .form-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        font-size: 1rem;
        color: var(--text-primary);
        background-color: #ffffff;
        transition: 
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
        box-sizing: border-box;
    }

    .form-input:focus {
        outline: none;
        border-color: var(--text-primary);
        box-shadow: 0 0 0 2px rgba(33, 33, 33, 0.1);
    }

    .form-input::placeholder {
        color: var(--text-secondary);
        font-style: italic;
    }

    /* 
      设计理念: 输入框与按钮组合
      - 验证码输入框和发送按钮的组合布局
    */
    .input-with-button {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .input-with-button .form-input {
        flex: 1;
    }

    /* 
      设计理念: 按钮样式
      - 与主站按钮风格保持完全一致
      - 主要按钮和次要按钮的区分
    */
    .primary-btn {
        width: 100%;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: var(--border-radius-md);
        background-color: var(--text-primary);
        color: white;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color var(--transition-speed) ease;
        margin-top: 1rem;
    }

    .primary-btn:hover:not(:disabled) {
        background-color: #424242;
    }

    .primary-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    .secondary-btn {
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .secondary-btn:hover:not(:disabled) {
        background-color: var(--hover-bg);
        border-color: var(--text-primary);
    }

    .secondary-btn:disabled {
        background-color: #f5f5f5;
        border-color: #e0e0e0;
        color: var(--text-secondary);
        cursor: not-allowed;
    }

    /* 
      设计理念: 错误消息
      - 清晰的错误提示样式
    */
    .error-message {
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: var(--border-radius-md);
        padding: 1rem;
        margin-bottom: 1.5rem;
        color: #c62828;
        text-align: center;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    /* 
      设计理念: 返回链接
      - 提供清晰的导航选项
    */
    .back-link {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
    }

    .back-link a {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.9rem;
        transition: color var(--transition-speed) ease;
    }

    .back-link a:hover {
        color: var(--text-primary);
        text-decoration: underline;
    }

    /* 
      设计理念: 响应式设计
      - 在小屏幕上优化布局和间距
    */
    @media (max-width: 768px) {
        .page-header h1 {
            font-size: 2rem;
        }

        .reset-card {
            margin: 0 1rem;
            padding: 2rem 1.5rem;
        }

        .input-with-button {
            flex-direction: column;
            gap: 0.5rem;
        }

        .secondary-btn {
            width: 100%;
        }
    }

    @media (max-width: 480px) {
        .reset-card {
            padding: 1.5rem 1rem;
        }

        .step-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
        }

        .step-header h2 {
            font-size: 1.25rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }
    }
</style>