<script>
    import { goto } from "$app/navigation";
    let email = $state("");
    let password = $state("");
    let errorMessage = $state("");
    let errorField = $state("");
    let isLoading = $state(false);

    // 邮箱格式验证正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    async function handleLogin(event) {
        event.preventDefault(); // 阻止表单默认提交行为
        isLoading = true;
        errorMessage = "";
        errorField = "";

        try {
            // 客户端验证
            if (!email) {
                errorField = "email";
                throw new Error("请输入邮箱");
            }
            if (!emailRegex.test(email)) {
                errorField = "email";
                throw new Error("请输入有效的邮箱地址");
            }
            if (!password) {
                errorField = "password";
                throw new Error("请输入密码");
            }
            if (password.length < 6) {
                errorField = "password";
                throw new Error("密码长度至少为6个字符");
            }

            // 发送登录请求到后端
            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!result.success) {
                // 根据后端返回的错误信息设置 errorField
                if (response.status === 401 || result.message.includes("邮箱") || result.message.includes("密码")) {
                    errorField = "password"; // 通常将“邮箱或密码错误”的提示放在密码栏，避免泄露邮箱是否存在
                }
                throw new Error(result.message);
            }

            // 登录成功，重定向到首页
            await goto("/", { invalidateAll: true });
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = "发生未知错误";
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="auth-container">
    <div class="auth-card">
        <h1>欢迎回来</h1>

        <!-- 全局错误提示 (当错误不针对特定字段时显示) -->
        {#if errorMessage && !errorField}
            <div class="alert alert-error">
                {errorMessage}
            </div>
        {/if}

        <form onsubmit={handleLogin}>
            <div class="form-group">
                <label for="email">邮箱</label>
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    placeholder="请输入邮箱"
                    class="form-input"
                    class:is-error={errorField === "email"}
                    disabled={isLoading}
                />
                {#if errorField === "email"}
                    <p class="error-message">{errorMessage}</p>
                {/if}
            </div>

            <div class="form-group">
                <label for="password">密码</label>
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    placeholder="请输入密码"
                    class="form-input"
                    class:is-error={errorField === "password"}
                    disabled={isLoading}
                />
                {#if errorField === "password"}
                    <p class="error-message">{errorMessage}</p>
                {/if}
            </div>

            <button type="submit" class="submit-btn" disabled={isLoading}>
                {#if isLoading}
                    <span class="spinner"></span> 正在登录...
                {:else}
                    登录
                {/if}
            </button>
        </form>

        <div class="secondary-action">
            <p>还没有账户？<a href="/register">立即注册</a></p>
        </div>
    </div>
</div>

<style>
    /* 
      设计理念: 专注的氛围
      - .auth-container 将整个登录卡片在视口中居中，移除所有干扰，
        让用户能完全专注于登录这一项任务。
    */
    .auth-container {
        display: flex;
        justify-content: center;
        align-items: flex-start; /* 从顶部开始对齐，更自然 */
        min-height: calc(100vh - 80px); /* 减去大约的导航栏高度 */
        padding: 4rem 1.5rem;
        background-color: var(--background);
    }
    
    /* 
      设计理念: 登录“卡片”
      - 将表单包裹在一个“材质卡片”中，与 ArticleCard 风格一致。
      - 使用阴影创造深度，使其从背景中“浮”出。
    */
    .auth-card {
        width: 100%;
        max-width: 400px;
        padding: 2.5rem;
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
    }

    h1 {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        /* 移除 text-align: center; 以建立左对齐轴 */
        margin: 0 0 2rem 0;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    /* 
      设计理念: 统一的输入框样式
      - 完全复用文章编辑器中的 .form-input 样式，确保全站输入体验的一致性。
      - 这是设计系统价值的核心体现。
    */
    .form-input {
        width: 100%;
        box-sizing: border-box; /* 确保padding和border包含在width内 */
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
    }
    .form-input:focus {
        border-color: var(--highlight-color);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--highlight-color) 20%, transparent);
    }
    .form-input.is-error {
        border-color: var(--error-color, #d32f2f);
    }
    .form-input.is-error:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--error-color, #d32f2f) 25%, transparent);
    }

    .error-message {
        margin-top: 0.5rem;
        color: var(--error-color, #d32f2f);
        font-size: 0.875rem;
    }

    /* 
      设计理念: 明确的主要操作
      - 登录按钮是此页面的唯一主要操作，必须醒目且易于点击。
      - 样式与 "注册"、"发布文章" 等按钮完全一致。
      - 默认占满整个宽度，方便移动端用户点击。
    */
    .submit-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-top: 1rem;
        padding: 0.85rem 1.5rem;
        border: none;
        border-radius: var(--border-radius-md);
        background-color: var(--text-primary);
        color: white;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color var(--transition-speed) ease;
    }
    .submit-btn:hover:not(:disabled) {
        background-color: #424242;
    }
    .submit-btn:disabled {
        background-color: var(--hover-bg);
        color: var(--text-secondary);
        cursor: wait; /* 使用等待光标，提供清晰的加载反馈 */
    }

    /* 
      设计理念: 次要操作
      - 注册链接是次要操作，不应与主按钮竞争。
      - 将其放置在卡片底部，使用中性颜色，视觉上更轻。
    */
    .secondary-action {
        margin-top: 2rem;
        /* 移除 text-align: center; 以建立左对齐轴 */
    }
    .secondary-action p {
        margin: 0;
        color: var(--text-secondary);
    }
    .secondary-action a {
        color: var(--text-primary);
        font-weight: 500;
        text-decoration: none;
    }
    .secondary-action a:hover {
        text-decoration: underline;
    }

    /* 
      设计理念: 全局提示框
      - 复用已定义的 alert 样式，确保反馈信息在全站表现一致。
    */
    .alert {
        padding: 1rem 1.5rem;
        margin-bottom: 1.5rem;
        border-radius: var(--border-radius-md);
        border: 1px solid transparent;
    }
    .alert.alert-error {
        background-color: var(--error-bg, #ffebee);
        color: var(--error-color, #d32f2f);
        border-color: color-mix(in srgb, var(--error-color, #d32f2f) 40%, transparent);
    }
    
    /* 简单的加载中 spinner */
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spinner {
        display: inline-block;
        width: 1em;
        height: 1em;
        margin-right: 0.75em;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

</style>