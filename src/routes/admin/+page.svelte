<script lang="ts">
    import { goto } from "$app/navigation";
    import { invalidateAll } from "$app/navigation";
    import { onMount } from "svelte";
    import type { AdminStats } from '$lib/server/utils/adminStats';
    import type { AdminSchema } from '$lib/schema/adminSchema';

    let { data } = $props<{ 
        data: { 
            stats: AdminStats; 
            admin: AdminSchema;
        } 
    }>();
    let stats = $derived(data.stats as AdminStats);
    let isRefreshing = $state(false);
    let animatedStats = $state({
        totalUsers: 0,
        totalArticles: 0,
        totalComments: 0,
        todayNew: 0
    });

    function navigateToUsers() {
        goto("/admin/users");
    }

    function navigateToArticles() {
        goto("/admin/articles");
    }

    function navigateToComments() {
        goto("/admin/comments");
    }

    function navigateToAdminEdit() {
        goto("/admin/edit");
    }

    function handleKeydown(event: KeyboardEvent, navigateFunction: () => void) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateFunction();
        }
    }

    // 格式化数字显示
    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // 刷新统计数据
    async function refreshStats() {
        if (isRefreshing) return;
        
        isRefreshing = true;
        try {
            await invalidateAll();
            // 重新执行动画
            animateNumbers();
        } catch (error) {
            console.error('刷新统计数据失败:', error);
        } finally {
            isRefreshing = false;
        }
    }

    // 获取最后更新时间
    function getLastUpdateTime(): string {
        return new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // 数字动画函数
    function animateNumber(
        from: number, 
        to: number, 
        duration: number, 
        callback: (value: number) => void
    ) {
        const start = Date.now();
        const difference = to - from;
        
        function update() {
            const now = Date.now();
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easeOutCubic缓动函数
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + difference * easeOutCubic);
            
            callback(current);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // 执行所有数字动画
    function animateNumbers() {
        animateNumber(0, stats.totalUsers, 2000, (value) => {
            animatedStats.totalUsers = value;
        });
        
        animateNumber(0, stats.totalArticles, 2200, (value) => {
            animatedStats.totalArticles = value;
        });
        
        animateNumber(0, stats.totalComments, 2400, (value) => {
            animatedStats.totalComments = value;
        });
        
        animateNumber(0, stats.todayNew, 1800, (value) => {
            animatedStats.todayNew = value;
        });
    }

    // 组件挂载时执行动画
    onMount(() => {
        // 延迟一点开始动画，让页面先渲染完成
        setTimeout(animateNumbers, 300);
    });

    // 获取管理员权限级别显示文本
    function getAdminRoleText(priority: number): string {
        return priority === 0 ? '超级管理员' : '普通管理员';
    }

    // 获取管理员权限级别颜色
    function getAdminRoleColor(priority: number): string {
        return priority === 0 ? 'super-admin' : 'regular-admin';
    }
</script>

<svelte:head>
    <title>后台管理 - Synapse</title>
    <meta name="description" content="网站后台管理中心" />
</svelte:head>

<main class="admin-main">
    <div class="admin-container">
        <!-- 管理员信息头部 -->
        <div class="admin-header">
            <div class="admin-info">
                <h1>管理后台</h1>
                <div class="admin-badge {getAdminRoleColor(data.admin.priority)}">
                    {getAdminRoleText(data.admin.priority)}
                </div>
            </div>
            <div class="admin-actions">
                <div class="welcome-text">
                    欢迎回来，管理员
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
            </div>
        </div>

        <section class="page-header">
            <h1>后台管理</h1>
        </section>

        <div class="admin-cards-grid">
            <!-- 用户管理卡片 -->
            <div class="admin-card" role="button" tabindex="0" 
                onclick={navigateToUsers} 
                onkeydown={(e) => handleKeydown(e, navigateToUsers)}>
                <div class="admin-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                </div>
                <div class="admin-card-content">
                    <h2>用户管理</h2>
                    <p>管理注册用户，查看用户信息和活动状态</p>
                </div>
                <div class="admin-card-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>

            <!-- 文章管理卡片 -->
            <div class="admin-card" role="button" tabindex="0" 
                onclick={navigateToArticles} 
                onkeydown={(e) => handleKeydown(e, navigateToArticles)}>
                <div class="admin-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                </div>
                <div class="admin-card-content">
                    <h2>文章管理</h2>
                    <p>管理平台文章，审核内容和处理举报</p>
                </div>
                <div class="admin-card-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>

            <!-- 评论管理卡片 -->
            <div class="admin-card" role="button" tabindex="0" 
                onclick={navigateToComments} 
                onkeydown={(e) => handleKeydown(e, navigateToComments)}>
                <div class="admin-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        <path d="M7 9h10M7 13h6"/>
                    </svg>
                </div>
                <div class="admin-card-content">
                    <h2>评论管理</h2>
                    <p>管理用户评论，维护良好的讨论环境</p>
                </div>
                <div class="admin-card-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                </div>
            </div>

            <!-- 管理员编辑卡片 - 仅超级管理员可见 -->
            {#if data.admin.priority === 0}
                <div class="admin-card admin-card-special" role="button" tabindex="0" 
                    onclick={navigateToAdminEdit} 
                    onkeydown={(e) => handleKeydown(e, navigateToAdminEdit)}>
                    <div class="admin-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L11.92 12.25L17.58 6.59L20.17 9.17L21 9ZM1 18.5C1 19.6 1.4 20.6 2.1 21.3C2.8 22 3.8 22.4 4.9 22.4C6 22.4 7 22 7.7 21.3C8.4 20.6 8.8 19.6 8.8 18.5C8.8 17.4 8.4 16.4 7.7 15.7C7 15 6 14.6 4.9 14.6C3.8 14.6 2.8 15 2.1 15.7C1.4 16.4 1 17.4 1 18.5ZM12 14.6C10.9 14.6 9.9 15 9.2 15.7C8.5 16.4 8.1 17.4 8.1 18.5C8.1 19.6 8.5 20.6 9.2 21.3C9.9 22 10.9 22.4 12 22.4C13.1 22.4 14.1 22 14.8 21.3C15.5 20.6 15.9 19.6 15.9 18.5C15.9 17.4 15.5 16.4 14.8 15.7C14.1 15 13.1 14.6 12 14.6ZM19.1 14.6C18 14.6 17 15 16.3 15.7C15.6 16.4 15.2 17.4 15.2 18.5C15.2 19.6 15.6 20.6 16.3 21.3C17 22 18 22.4 19.1 22.4C20.2 22.4 21.2 22 21.9 21.3C22.6 20.6 23 19.6 23 18.5C23 17.4 22.6 16.4 21.9 15.7C21.2 15 20.2 14.6 19.1 14.6Z"/>
                        </svg>
                    </div>
                    <div class="admin-card-content">
                        <h2>管理员编辑</h2>
                        <p>添加或删除普通管理员，管理权限分配</p>
                    </div>
                    <div class="admin-card-arrow">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                    </div>
                </div>
            {/if}
        </div>

        <!-- 统计信息概览 -->
        <section class="admin-stats">
            <div class="stats-header">
                <h2>快速概览</h2>
                <div class="stats-actions">
                    <span class="last-update">最后更新: {getLastUpdateTime()}</span>
                    <button 
                        class="refresh-btn" 
                        onclick={refreshStats}
                        disabled={isRefreshing}
                        aria-label="刷新统计数据"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            class:spinning={isRefreshing}
                        >
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        {#if isRefreshing}
                            刷新中...
                        {:else}
                            刷新
                        {/if}
                    </button>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card users-stat">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                    </div>
                    <div class="stat-number">{formatNumber(animatedStats.totalUsers)}</div>
                    <div class="stat-label">总用户数</div>
                </div>
                <div class="stat-card articles-stat">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                    </div>
                    <div class="stat-number">{formatNumber(animatedStats.totalArticles)}</div>
                    <div class="stat-label">已发布文章</div>
                </div>
                <div class="stat-card comments-stat">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            <path d="M7 9h10M7 13h6"/>
                        </svg>
                    </div>
                    <div class="stat-number">{formatNumber(animatedStats.totalComments)}</div>
                    <div class="stat-label">总评论数</div>
                </div>
                <div class="stat-card today-stat">
                    <div class="stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="stat-number">{formatNumber(animatedStats.todayNew)}</div>
                    <div class="stat-label">今日新增</div>
                </div>
            </div>
        </section>
    </div>
</main>

<style>
    /* 继承并扩展全局样式 */
    .page-header {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border-color);
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1rem 0;
    }

    /* 
      设计理念: 管理卡片网格
      - 使用CSS Grid创建响应式布局
      - 卡片大小一致，在大屏幕上显示3列，中等屏幕显示2列，小屏幕显示1列
    */
    .admin-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        margin-bottom: 4rem;
    }

    /* 
      设计理念: 管理卡片
      - 遵循网站一致的卡片设计语言
      - 添加悬停效果和点击反馈
      - 使用图标、内容和箭头的三栏布局
    */
    .admin-card {
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        padding: 2rem;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        transition:
            transform var(--transition-speed) ease-in-out,
            box-shadow var(--transition-speed) ease-in-out;
        cursor: pointer;
        border: 1px solid transparent;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
        overflow: hidden;
    }

    .admin-card:hover {
        transform: translateY(-2px);
        box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.08),
            0 8px 16px rgba(0, 0, 0, 0.06);
    }

    .admin-card:focus {
        outline: none;
        border-color: var(--highlight-color);
        box-shadow: 0 0 0 2px var(--highlight-color);
    }

    /* 卡片图标区域 */
    .admin-card-icon {
        flex-shrink: 0;
        width: 3rem;
        height: 3rem;
        background-color: var(--background);
        border-radius: var(--border-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
    }

    .admin-card-icon svg {
        width: 1.75rem;
        height: 1.75rem;
    }

    /* 卡片内容区域 */
    .admin-card-content {
        flex: 1;
    }

    .admin-card-content h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
    }

    .admin-card-content p {
        font-size: 1rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.5;
    }

    /* 卡片箭头 */
    .admin-card-arrow {
        flex-shrink: 0;
        color: var(--text-secondary);
        transition: 
            transform var(--transition-speed) ease,
            color var(--transition-speed) ease;
    }

    .admin-card:hover .admin-card-arrow {
        transform: translateX(4px);
        color: var(--text-primary);
    }

    .admin-card-arrow svg {
        width: 1.5rem;
        height: 1.5rem;
    }

    /* 
      统计信息概览区域
    */
    .admin-stats {
        margin-top: 3rem;
    }

    .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .stats-header h2 {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .stats-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .last-update {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        background-color: #ffffff;
        color: var(--text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease;
    }

    .refresh-btn:hover:not(:disabled) {
        background-color: var(--hover-bg);
        border-color: var(--text-primary);
    }

    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .refresh-btn svg {
        width: 1rem;
        height: 1rem;
    }

    .refresh-btn svg.spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
    }

    .stat-card {
        background-color: #ffffff;
        border-radius: var(--border-radius-md);
        padding: 2rem 1.5rem;
        text-align: center;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.06),
            0 2px 6px rgba(0, 0, 0, 0.04);
        border-left: 4px solid var(--text-primary);
        position: relative;
        overflow: hidden;
        transition: transform var(--transition-speed) ease;
    }

    .stat-card:hover {
        transform: translateY(-2px);
    }

    .stat-icon {
        width: 2.5rem;
        height: 2.5rem;
        margin: 0 auto 1rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background);
        color: var(--text-primary);
    }

    .stat-icon svg {
        width: 1.5rem;
        height: 1.5rem;
    }

    .stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        line-height: 1;
    }

    .stat-label {
        font-size: 1rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    /* 统一的统计卡片设计（使用一致的黑白灰风格） */
    .users-stat,
    .articles-stat,
    .comments-stat,
    .today-stat {
        border-left-color: var(--text-primary);
    }

    .users-stat .stat-icon,
    .articles-stat .stat-icon,
    .comments-stat .stat-icon,
    .today-stat .stat-icon {
        background-color: rgba(33, 33, 33, 0.08);
        color: var(--text-primary);
    }

    .users-stat .stat-number,
    .articles-stat .stat-number,
    .comments-stat .stat-number,
    .today-stat .stat-number {
        color: var(--text-primary);
    }

    /* === 管理员信息头部 === */
    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: var(--border-radius-md);
        color: white;
    }

    .admin-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .admin-info h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
    }

    .admin-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .admin-badge.super-admin {
        background-color: rgba(255, 215, 0, 0.2);
        border: 2px solid #ffd700;
        color: #ffd700;
    }

    .admin-badge.regular-admin {
        background-color: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.5);
        color: rgba(255, 255, 255, 0.9);
    }

    .admin-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .welcome-text {
        font-size: 1rem;
        opacity: 0.9;
    }

    .admin-actions svg {
        width: 2rem;
        height: 2rem;
        opacity: 0.8;
    }

    /* 特殊管理员卡片样式 */
    .admin-card-special {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: 2px solid #ffd700;
    }

    .admin-card-special .admin-card-icon {
        background-color: rgba(255, 215, 0, 0.2);
        color: #ffd700;
    }

    .admin-card-special .admin-card-content h2 {
        color: white;
    }

    .admin-card-special .admin-card-content p {
        color: rgba(255, 255, 255, 0.9);
    }

    .admin-card-special .admin-card-arrow {
        color: rgba(255, 255, 255, 0.8);
    }

    .admin-card-special:hover .admin-card-arrow {
        color: #ffd700;
    }

    .admin-card-special:hover {
        box-shadow:
            0 4px 8px rgba(255, 215, 0, 0.3),
            0 8px 16px rgba(102, 126, 234, 0.2);
    }

    /* 响应式调整 */
    @media (max-width: 768px) {
        .admin-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .admin-card-arrow {
            transform: rotate(90deg);
        }

        .admin-card:hover .admin-card-arrow {
            transform: rotate(90deg) translateX(4px);
        }

        .page-header h1 {
            font-size: 2rem;
        }

        .stats-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .stats-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .stat-card {
            padding: 1.5rem 1rem;
        }

        .stat-number {
            font-size: 2rem;
        }
    }

    @media (max-width: 480px) {
        .admin-cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
