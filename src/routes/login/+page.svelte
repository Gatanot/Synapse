<!-- todo:
逻辑:发送将用户信息发送至'/login',接受登录信息.登陆成功跳转至'/'
界面:用户输入邮箱与密码并通过登录按钮登录.一个连接指向注册界面
样式:待定 -->
<script>
    import { goto } from "$app/navigation";

    let email = "";
    let password = "";
    let errorMessage = "";
    let errorField = "";
    let isLoading = false;

    // 邮箱格式验证正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    async function handleLogin(event) {
        event.preventDefault();
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
                if (response.status === 401) {
                    errorField = "email"; // 后端返回“邮箱或密码错误”，显示在邮箱字段
                }
                throw new Error(result.message);
            }

            // 登录成功，重定向到首页
            await goto("/");
        } catch (error) {
            errorMessage = error.message || "登录失败，请稍后重试";
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="login-container">
    {#if errorMessage && !errorField}
        <div class="error-message">
            {errorMessage}
        </div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
            <label for="email">邮箱:</label>
            <input
                type="email"
                id="email"
                bind:value={email}
                placeholder="请输入邮箱"
                class:error={errorField === "email"}
            />
            {#if errorField === "email" && errorMessage}
                <span class="field-error">{errorMessage}</span>
            {/if}
        </div>

        <div class="form-group">
            <label for="password">密码:</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                placeholder="请输入密码"
                class:error={errorField === "password"}
            />
            {#if errorField === "password" && errorMessage}
                <span class="field-error">{errorMessage}</span>
            {/if}
        </div>

        <button type="submit" disabled={isLoading}>
            {#if isLoading}正在登录...{:else}登录{/if}
        </button>
    </form>

    <div class="register-link">
        没有账户? <a href="/register">前往注册</a>
    </div>
</div>

<style>
    .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }

    .form-group {
        margin-bottom: 15px;
    }

    label {
        display: block;
        margin-bottom: 5px;
    }

    input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    input.error {
        border-color: red;
    }

    .error-message {
        color: red;
        margin-bottom: 15px;
        text-align: center;
    }

    .field-error {
        color: red;
        font-size: 12px;
        margin-top: 5px;
        display: block;
    }

    button {
        width: 100%;
        padding: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    .register-link {
        margin-top: 15px;
        text-align: center;
    }
</style>
