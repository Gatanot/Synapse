<!-- src/routes/register/+page.svelte -->
<script lang="ts">
    import { goto } from '$app/navigation';

    let email = '';
    let username = '';
    let password = '';
    let errorMessage: string | null = null;
    let errorField: string | null = null;   // 用于存储哪个字段出错了，如果API返回此信息
    let isLoading = false; // 防止重复提交

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
        if (username.trim().length < 2) { // 假设用户名至少2个字符
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
                await goto('/');
            } else {
                // 注册失败
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

<main>
    <h1>注册界面</h1>

    {#if errorMessage}
        <p class="error" role="alert">
            {errorMessage}
            <!-- {#if errorField}
                <small>(相关字段: {errorField})</small>
            {/if} -->
        </p>
    {/if}

    <!-- on:submit|preventDefault 调用 handleSubmit 函数并阻止表单的默认提交行为 -->
    <form on:submit|preventDefault={handleSubmit}>
        <div>
            <label for="email">邮箱:</label>
            <input
                type="email"
                id="email"
                name="email"
                bind:value={email}
                required
                aria-describedby={(errorField === 'email' && errorMessage) ? 'email-error' : null}
                class:invalid={errorField === 'email' && errorMessage}
            />
            {#if errorField === 'email' && errorMessage}
                <small id="email-error" class="field-error">{errorMessage}</small>
            {/if}
        </div>
        <div>
            <label for="username">用户名:</label>
            <input
                type="text"
                id="username"
                name="username"
                bind:value={username}
                required
                aria-describedby={(errorField === 'name' && errorMessage) ? 'username-error' : null}
                class:invalid={errorField === 'name' && errorMessage}
            />
             {#if errorField === 'name' && errorMessage}
                <small id="username-error" class="field-error">{errorMessage}</small>
            {/if}
        </div>
        <div>
            <label for="password">密码:</label>
            <input
                type="password"
                id="password"
                name="password"
                bind:value={password}
                required
                minlength="6"
                aria-describedby={(errorField === 'password' && errorMessage) ? 'password-error' : null}
                class:invalid={errorField === 'password' && errorMessage}
            />
            {#if errorField === 'password' && errorMessage}
                <small id="password-error" class="field-error">{errorMessage}</small>
            {/if}
        </div>
        <button type="submit" disabled={isLoading}>
            {#if isLoading}正在注册...{:else}注册{/if}
        </button>
    </form>

    <p>
        已有账户? <a href="/login">前往登录</a>
    </p>
</main>

<style>
    main {
        max-width: 400px;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-family: sans-serif;
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 20px;
    }

    div {
        margin-bottom: 15px;
    }

    label {
        display: block;
        margin-bottom: 5px;
        color: #555;
        font-weight: bold;
    }

    input[type="email"],
    input[type="text"],
    input[type="password"] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box; /* 确保 padding 不会增加元素的总宽度 */
    }

    input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    input.invalid { /* 当字段无效时的样式 */
        border-color: red;
        background-color: #fff0f0;
    }
    input.invalid:focus {
        border-color: red;
        box-shadow: 0 0 0 0.2rem rgba(255, 0, 0, 0.25);
    }


    button[type="submit"] {
        width: 100%;
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s;
    }

    button[type="submit"]:hover:not(:disabled) {
        background-color: #0056b3;
    }

    button:disabled { /* 按钮禁用时的样式 */
        background-color: #ccc;
        cursor: not-allowed;
    }

    .error {
        color: red;
        background-color: #ffebee;
        border: 1px solid red;
        padding: 10px;
        margin-bottom: 20px; /* 增加与表单的间距 */
        border-radius: 4px;
        text-align: center;
    }
    /* .error small {
        display: block;
        font-size: 0.9em;
        color: #c00;
        margin-top: 5px;
    } */

    .field-error { /* 单个字段下方的错误提示 */
        display: block; /* 确保它占据一行 */
        color: red;
        font-size: 0.85em;
        margin-top: 4px;
    }

    p {
        text-align: center;
        margin-top: 20px;
    }

    a {
        color: #007bff;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>