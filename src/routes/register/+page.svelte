<!-- src/routes/register/+page.svelte -->
<script lang="ts">
    import { goto } from '$app/navigation';

    let email = '';
    let username = '';
    let password = '';

    let code = '';
    let codeSent = false;
    let codeCountdown = 0;
    let errorMessage: string | null = null;
    let errorField: string | null = null;   // 用于存储哪个字段出错了，如果API返回此信息
    let isLoading = false; // 防止重复提交

    async function handleSendCode() {
        errorMessage = null;
        errorField = null;
        if (!email.includes('@')) {
            errorMessage = '请先输入有效邮箱';
            errorField = 'email';
            return;
        }
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
        }
    }

    async function handleSubmit() {
        isLoading = true;
        errorMessage = null;
        errorField = null;

        // 基本的前端校验
        if (!email.includes('@')) {
            errorMessage = '请输入有效的邮箱地址。';
            errorField = 'email';
            isLoading = false;
            return;
        }
        if (username.trim().length < 2) {
            errorMessage = '用户名至少需要2个字符。';
            errorField = 'username';
            isLoading = false;
            return;
        }
        if (password.length < 6) {
            errorMessage = '密码长度至少为6位。';
            errorField = 'password';
            isLoading = false;
            return;
        }
        if (!code) {
            errorMessage = '请填写验证码。';
            errorField = 'code';
            isLoading = false;
            return;
        }

        // 校验验证码
        try {
            const verifyRes = await fetch('/api/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, action: 'verify' })
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                errorMessage = verifyData.message || '验证码校验失败';
                errorField = 'code';
                isLoading = false;
                return;
            }
        } catch (err) {
            errorMessage = '验证码校验失败，请稍后再试。';
            errorField = 'code';
            isLoading = false;
            return;
        }

        // 验证码通过后再注册
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    name: username,
                    password: password
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                // 注册成功并自动登录，刷新页面以获取登录态
                window.location.href = '/';
            } else if (data.sessionCreated === false) {
                // 注册成功但自动登录失败，提示用户手动登录
                errorMessage = data.message || '注册成功，但自动登录失败，请手动登录。';
                setTimeout(() => goto('/login'), 2000);
            } else {
                errorMessage = data.message || '注册失败，请检查您的输入或稍后再试。';
                if (data.field) {
                    errorField = data.field;
                }
                console.error('注册错误:', data.message, data);
            }
        } catch (err) {
            console.error('提交注册请求时发生网络或解析错误:', err);
            errorMessage = '无法连接到服务器或服务器响应格式不正确，请稍后再试。';
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>注册 - Synapse</title>
    <meta name="description" content="加入 Synapse，开始您的知识分享之旅" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <h1>加入 Synapse</h1>
        <p class="page-subtitle">开始您的文本交流之旅</p>
    </section>

    <div class="register-card">
        {#if errorMessage}
            <div class="error-message" role="alert">
                {errorMessage}
            </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="register-form">
            <div class="form-group">
                <label for="email">邮箱地址</label>
                <div class="input-with-button">
                    <input
                        type="email"
                        id="email"
                        name="email"
                        bind:value={email}
                        required
                        placeholder="请输入您的邮箱地址"
                        class="form-input"
                        class:invalid={errorField === 'email' && errorMessage}
                        aria-describedby={(errorField === 'email' && errorMessage) ? 'email-error' : null}
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
                {#if errorField === 'email' && errorMessage}
                    <small id="email-error" class="field-error">{errorMessage}</small>
                {/if}
            </div>

            <div class="form-group">
                <label for="code">验证码</label>
                <input
                    type="text"
                    id="code"
                    name="code"
                    bind:value={code}
                    required
                    placeholder="请输入收到的验证码"
                    class="form-input"
                    class:invalid={errorField === 'code' && errorMessage}
                    aria-describedby={(errorField === 'code' && errorMessage) ? 'code-error' : null}
                />
                {#if errorField === 'code' && errorMessage}
                    <small id="code-error" class="field-error">{errorMessage}</small>
                {/if}
            </div>

            <div class="form-group">
                <label for="username">用户名</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    bind:value={username}
                    required
                    placeholder="请输入用户名（至少2个字符）"
                    class="form-input"
                    class:invalid={errorField === 'name' && errorMessage}
                    aria-describedby={(errorField === 'name' && errorMessage) ? 'username-error' : null}
                />
                {#if errorField === 'name' && errorMessage}
                    <small id="username-error" class="field-error">{errorMessage}</small>
                {/if}
            </div>

            <div class="form-group">
                <label for="password">密码</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    bind:value={password}
                    required
                    minlength="6"
                    placeholder="请输入密码（至少6位字符）"
                    class="form-input"
                    class:invalid={errorField === 'password' && errorMessage}
                    aria-describedby={(errorField === 'password' && errorMessage) ? 'password-error' : null}
                />
                {#if errorField === 'password' && errorMessage}
                    <small id="password-error" class="field-error">{errorMessage}</small>
                {/if}
            </div>

            <button type="submit" disabled={isLoading} class="primary-btn">
                {#if isLoading}正在注册...{:else}注册{/if}
            </button>
        </form>

        <div class="login-link">
            <span>已有账户？</span>
            <a href="/login">前往登录</a>
        </div>
    </div>
</main>

<style>
    /* 
      设计理念: 页面头部
      - 与主站保持一致的头部设计风格
      - 添加副标题增强用户体验
    */
    .page-header {
        margin-bottom: 2.5rem;
        text-align: center;
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin: 0;
        font-style: italic;
    }

    /* 
      设计理念: 注册卡片
      - 使用与主站相同的卡片设计风格
      - 清晰的信息层次和视觉结构
    */
    .register-card {
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

    /* 
      设计理念: 表单样式
      - 清晰的表单布局和间距
    */
    .register-form {
        margin-bottom: 2rem;
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

    .form-input.invalid {
        border-color: #c62828;
        background-color: #ffebee;
    }

    .form-input.invalid:focus {
        border-color: #c62828;
        box-shadow: 0 0 0 2px rgba(198, 40, 40, 0.1);
    }

    /* 
      设计理念: 输入框与按钮组合
      - 邮箱输入框和发送验证码按钮的组合布局
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

    .field-error {
        display: block;
        color: #c62828;
        font-size: 0.85rem;
        margin-top: 0.25rem;
        line-height: 1.3;
    }

    /* 
      设计理念: 登录链接
      - 提供清晰的导航选项
    */
    .login-link {
        text-align: center;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
        font-size: 0.9rem;
    }

    .login-link span {
        color: var(--text-secondary);
        margin-right: 0.5rem;
    }

    .login-link a {
        color: var(--text-primary);
        text-decoration: none;
        font-weight: 500;
        transition: color var(--transition-speed) ease;
    }

    .login-link a:hover {
        color: #424242;
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

        .register-card {
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
        .register-card {
            padding: 1.5rem 1rem;
        }

        .page-header {
            margin-bottom: 2rem;
        }

        .page-header h1 {
            font-size: 1.75rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }
    }
</style>