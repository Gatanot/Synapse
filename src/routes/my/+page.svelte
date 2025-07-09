<script lang="ts">
import { goto } from "$app/navigation";

let { data } = $props();

function toArticlesLists() {
    goto("/my/articles");
}

function toEditmyprofile() {
    goto("/my/profile");
}

function toResetPassword() {
    goto("/password/reset");
}

function toDrafts() {
    goto("/my/drafts");
}
</script>

<svelte:head>
    <title>我的主页 - Synapse</title>
    <meta name="description" content="个人中心，管理您的文章和个人信息" />
</svelte:head>

<main class="main-content">
    <section class="page-header">
        <h1>我的主页</h1>
    </section>

    <!-- 用户信息卡片 -->
    <div class="user-info-card">
        <div class="user-header">
            <div class="user-details">
                <h2 class="user-name">{data.user?.name || "未知用户"}</h2>
                <p class="user-email">{data.user?.email || "未知邮箱"}</p>
            </div>
        </div>
        
        <div class="user-signature">
            <h3>个人签名</h3>
            <p>{data.user?.signature || "这个人很懒，什么都没有留下..."}</p>
        </div>
    </div>

    <!-- 快捷操作区域 -->
    <div class="actions-section">
        <h2 class="section-title">账号管理</h2>
        <div class="actions-grid">
            <button 
                type="button"
                onclick={toArticlesLists}
                class="action-card"
            >
                <div class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                </div>
                <div class="action-content">
                    <h3>我的文章</h3>
                    <p>查看和管理您发布的文章</p>
                </div>
            </button>

            <button 
                type="button"
                onclick={toDrafts}
                class="action-card"
            >
                <div class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                </div>
                <div class="action-content">
                    <h3>我的草稿</h3>
                    <p>查看和管理您的草稿文章</p>
                </div>
            </button>

            <button
                type="button"
                onclick={toEditmyprofile}
                class="action-card"
            >
                <div class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                    </svg>
                </div>
                <div class="action-content">
                    <h3>编辑资料</h3>
                    <p>修改个人信息和签名</p>
                </div>
            </button>

            <button
                type="button"
                onclick={toResetPassword}
                class="action-card"
            >
                <div class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6,8V6A6,6 0 0,1 12,0A6,6 0 0,1 18,6V8H20A2,2 0 0,1 22,10V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V10A2,2 0 0,1 4,8H6M8,6V8H16V6A4,4 0 0,0 12,2A4,4 0 0,0 8,6Z" />
                    </svg>
                </div>
                <div class="action-content">
                    <h3>重设密码</h3>
                    <p>修改您的登录密码</p>
                </div>
            </button>
        </div>
    </div>
</main>

<style>
    /* 
      设计理念: 页面头部
      - 与主站保持一致的头部设计风格
      - 简洁明了的标题展示
    */
    .page-header {
        margin-bottom: 2.5rem;
    }

    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    /* 
      设计理念: 用户信息卡片
      - 使用与主站相同的卡片设计风格
      - 清晰的信息层次和视觉结构
    */
    .user-info-card {
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        padding: 2rem;
        margin-bottom: 2.5rem;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .user-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }

    .user-details h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .user-details p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1rem;
    }

    .user-signature h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .user-signature p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 1rem;
        line-height: 1.6;
        font-style: italic;
    }

    /* 
      设计理念: 快捷操作区域
      - 清晰的区域分隔和标题
      - 响应式网格布局
    */
    .actions-section {
        margin-bottom: 2rem;
    }

    .section-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1.5rem 0;
    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
    }

    /* 
      设计理念: 操作卡片
      - 与主站按钮风格保持一致
      - 清晰的视觉反馈和交互状态
      - 图标和文字的良好结合
    */
    .action-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem;
        background-color: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        text-align: left;
        transition: 
            background-color var(--transition-speed) ease,
            border-color var(--transition-speed) ease,
            box-shadow var(--transition-speed) ease;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .action-card:hover {
        background-color: var(--hover-bg);
        border-color: var(--text-primary);
        box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.1),
            0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .action-icon {
        flex-shrink: 0;
        width: 3rem;
        height: 3rem;
        border-radius: var(--border-radius-md);
        background-color: var(--text-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color var(--transition-speed) ease;
    }

    .action-card:hover .action-icon {
        background-color: #424242;
    }

    .action-icon svg {
        width: 1.5rem;
        height: 1.5rem;
    }

    .action-content h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .action-content p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    /* 
      设计理念: 响应式设计
      - 在小屏幕上优化布局和间距
    */
    @media (max-width: 768px) {
        .page-header h1 {
            font-size: 2rem;
        }

        .user-info-card {
            padding: 1.5rem;
        }

        .user-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .actions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .action-card {
            padding: 1.25rem;
        }
    }

    @media (max-width: 480px) {
        .action-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .action-icon {
            margin-bottom: 0.5rem;
        }
    }
</style>