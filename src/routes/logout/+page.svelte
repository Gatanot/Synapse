<script>
    import { goto } from "$app/navigation";

    // 使用 $state 替代 let 来声明响应式状态
    let isLoading = $state(false);
    let errorMessage = $state("");

    async function handleLogout() {
        isLoading = true;
        errorMessage = "";

        try {
            const response = await fetch("/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "登出失败，请稍后重试。");
            }

            // 登出成功，跳转到首页。
            // 推荐加上 invalidateAll: true，以确保所有加载函数（load）重新运行，
            // 从而清除可能存在的用户状态（例如在 layout 中加载的用户信息）。
            await goto("/", { invalidateAll: true });
        } catch (error) {
            // 类型守卫，确保 error 是一个 Error 对象
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = "发生未知错误，请稍后重试。";
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<main>
    <h1>登出</h1>
    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}
    <button onclick={handleLogout} disabled={isLoading}>
        {#if isLoading}正在登出...{:else}登出{/if}
    </button>
</main>

<style>
    .error {
        color: red;
    }
</style>
