<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';

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
            alert('密码重置成功，请用新密码登录');
            goto('/login');
        } else {
            errorMessage = data.message;
        }
    } catch (err) {
        errorMessage = '密码重置失败，请稍后再试。';
    } finally {
        isLoading = false;
    }
}
</script>

<div class="reset-container">
    <h2>重设密码</h2>
    {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {/if}
    {#if step === 1}
        <div class="form-group">
            <label for="email">邮箱:</label>
            <input id="email" type="email" bind:value={email} placeholder="请输入注册邮箱" />
        </div>
        <div class="form-group">
            <label for="code">验证码:</label>
            <input id="code" type="text" bind:value={code} placeholder="请输入验证码" />
            <button type="button" on:click={handleSendCode} disabled={codeCountdown > 0} style="margin-left:8px;">
                {codeCountdown > 0 ? `重新发送(${codeCountdown})` : '发送验证码'}
            </button>
        </div>
        <button on:click={handleVerifyCode} disabled={isLoading}>下一步</button>
    {:else}
        <div class="form-group">
            <label for="newPassword">新密码:</label>
            <input id="newPassword" type="password" bind:value={newPassword} placeholder="请输入新密码" />
        </div>
        <button on:click={handleResetPassword} disabled={isLoading}>重置密码</button>
    {/if}
</div>

<style>
.reset-container {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-family: sans-serif;
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
.error-message {
    color: red;
    margin-bottom: 15px;
    text-align: center;
}
button {
    padding: 8px 16px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>