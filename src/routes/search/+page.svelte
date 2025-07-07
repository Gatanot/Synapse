<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import ArticleCard from '$lib/components/ArticleCard.svelte';

    // 从服务端加载的数据
    let { data } = $props();
    
    // 搜索框的本地状态
    let localSearchQuery = $state(data.searchTerm || '');
    let selectedSearchType = $state(data.searchType || 'all');
    let showSearchHistory = $state(false);
    let searchHistory = $state<string[]>([]);
    
    // 使用 $derived 替换 $: 响应式语句
    let searchResults = $derived(data.articles || []);
    let hasSearched = $derived(data.hasSearched || false);
    let errorMessage = $derived(data.error || '');

    // 搜索类型选项
    const searchTypeOptions = [
        { value: 'all', label: '全部', description: '搜索标题、标签、作者、内容' },
        { value: 'title', label: '标题', description: '仅搜索文章标题' },
        { value: 'tags', label: '标签', description: '仅搜索文章标签' },
        { value: 'author', label: '作者', description: '仅搜索作者名' },
        { value: 'content', label: '内容', description: '仅搜索文章内容' }
    ];

    // 从localStorage加载搜索历史
    function loadSearchHistory() {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('synapse-search-history');
                if (saved) {
                    searchHistory = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Failed to load search history:', error);
                searchHistory = [];
            }
        }
    }

    // 保存搜索历史到localStorage
    function saveSearchHistory() {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('synapse-search-history', JSON.stringify(searchHistory));
            } catch (error) {
                console.error('Failed to save search history:', error);
            }
        }
    }

    // 添加搜索记录到历史
    function addToSearchHistory(query: string) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // 移除重复项（如果存在）
        searchHistory = searchHistory.filter(item => item !== trimmedQuery);
        
        // 添加到开头
        searchHistory.unshift(trimmedQuery);
        
        // 限制历史记录数量（最多保存10条）
        if (searchHistory.length > 10) {
            searchHistory = searchHistory.slice(0, 10);
        }
        
        saveSearchHistory();
    }

    // 删除单条历史记录
    function removeHistoryItem(query: string) {
        searchHistory = searchHistory.filter(item => item !== query);
        saveSearchHistory();
    }

    // 清除所有历史记录
    function clearAllHistory() {
        searchHistory = [];
        saveSearchHistory();
    }

    // 处理搜索框焦点事件
    function handleSearchFocus() {
        showSearchHistory = true;
    }

    // 处理搜索框失焦事件
    function handleSearchBlur() {
        // 使用setTimeout延迟隐藏，允许用户点击历史记录项
        setTimeout(() => {
            showSearchHistory = false;
        }, 200);
    }

    // 处理历史记录项点击
    function handleHistoryItemClick(query: string) {
        localSearchQuery = query;
        showSearchHistory = false;
        handleLocalSearch();
    }

    // 处理搜索表单提交
    function handleLocalSearch() {
        if (localSearchQuery.trim()) {
            // 添加到搜索历史
            addToSearchHistory(localSearchQuery);
            
            const params = new URLSearchParams();
            params.set('q', localSearchQuery.trim());
            if (selectedSearchType !== 'all') {
                params.set('type', selectedSearchType);
            }
            goto(`/search?${params.toString()}`);
        }
    }

    // 获取搜索类型显示文本
    function getSearchTypeDisplay(type: string) {
        const option = searchTypeOptions.find(opt => opt.value === type);
        return option ? option.label : '全部';
    }

    // 页面加载时初始化搜索历史
    $effect(() => {
        loadSearchHistory();
    });
</script>

<svelte:head>
    <title>搜索文章 - Synapse</title>
    <meta name="description" content="搜索Synapse平台上的文章内容" />
</svelte:head>

<div class="search-page">
    <div class="search-container">
        <h1>搜索文章</h1>
        
        <!-- 搜索栏 -->
        <div class="search-section">
            <div class="search-input-wrapper">
                <div class="search-input-container">
                    <input
                        type="text"
                        placeholder="输入关键词搜索文章..."
                        bind:value={localSearchQuery}
                        onkeydown={(e) => e.key === "Enter" && handleLocalSearch()}
                        onfocus={handleSearchFocus}
                        onblur={handleSearchBlur}
                        class="search-input"
                    />
                    <select bind:value={selectedSearchType} class="search-type-select">
                        {#each searchTypeOptions as option}
                            <option value={option.value} title={option.description}>
                                {option.label}
                            </option>
                        {/each}
                    </select>
                    <div class="search-buttons">
                        <button onclick={handleLocalSearch} class="search-btn" disabled={!localSearchQuery.trim()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                            </svg>
                            搜索
                        </button>
                    </div>
                </div>
                
                <!-- 搜索历史记录 -->
                {#if showSearchHistory && searchHistory.length > 0}
                    <div class="search-history">
                        <div class="search-history-header">
                            <span class="history-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="history-icon">
                                    <path d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"></path>
                                </svg>
                                搜索历史
                            </span>
                            <button onclick={clearAllHistory} class="clear-all-btn" title="清空所有历史记录" aria-label="清空所有搜索历史记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="search-history-list">
                            {#each searchHistory as historyItem (historyItem)}
                                <div class="history-item">
                                    <button 
                                        onclick={() => handleHistoryItemClick(historyItem)} 
                                        class="history-item-content"
                                        title="点击搜索: {historyItem}"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="history-item-icon">
                                            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"></path>
                                        </svg>
                                        <span class="history-text">{historyItem}</span>
                                    </button>
                                    <button 
                                        onclick={() => removeHistoryItem(historyItem)} 
                                        class="remove-history-btn"
                                        title="删除此搜索记录"
                                        aria-label="删除搜索记录: {historyItem}"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- 搜索类型说明 -->
            {#if selectedSearchType !== 'all'}
                <div class="search-type-info">
                    <span class="info-icon">ℹ️</span>
                    <span>当前搜索范围：{getSearchTypeDisplay(selectedSearchType)}</span>
                </div>
            {/if}
        </div>
        
        <!-- 错误信息 -->
        {#if errorMessage}
            <div class="error-message">
                {errorMessage}
            </div>
        {/if}

        <!-- 搜索结果 -->
        {#if hasSearched}
            <div class="search-results">
                {#if searchResults.length > 0}
                    <div class="results-header">
                        <h2>搜索结果</h2>
                        <p class="results-count">
                            找到 {searchResults.length} 篇相关文章
                            {#if data.searchTerm}
                                - 关键词: "<span class="search-term">{data.searchTerm}</span>"
                            {/if}
                            {#if data.searchType && data.searchType !== 'all'}
                                (搜索范围: {getSearchTypeDisplay(data.searchType)})
                            {/if}
                        </p>
                    </div>
                    
                    <div class="articles-grid">
                        {#each searchResults as article (article._id)}
                            <ArticleCard {article} />
                        {/each}
                    </div>
                {:else}
                    <div class="no-results">
                        <h2>未找到相关文章</h2>
                        <p>
                            没有找到包含关键词 "<span class="search-term">{data.searchTerm}</span>" 的文章。
                        </p>
                        <p class="search-tips">
                            搜索建议：
                        </p>
                        <ul class="tips-list">
                            <li>检查关键词拼写是否正确</li>
                            <li>尝试使用更简短的关键词</li>
                            <li>尝试搜索文章标题、标签或作者名</li>
                            <li>使用不同的相关词汇</li>
                        </ul>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- 初始状态提示 -->
        {#if !hasSearched}
            <div class="search-tips-initial">
                <h2>开始搜索</h2>
                <p>在上方输入关键词来搜索文章。你可以选择不同的搜索范围：</p>
                <ul>
                    <li><strong>全部</strong> - 搜索文章标题、标签、作者名和内容</li>
                    <li><strong>标题</strong> - 仅搜索文章标题中的关键词</li>
                    <li><strong>标签</strong> - 仅搜索文章的标签</li>
                    <li><strong>作者</strong> - 仅搜索作者的用户名</li>
                    <li><strong>内容</strong> - 仅搜索文章正文内容</li>
                </ul>
                <div class="search-tips-note">
                    <p><strong>提示：</strong>选择具体的搜索范围可以获得更精确的搜索结果。</p>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .search-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .search-container h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    /* 搜索栏样式 */
    .search-section {
        margin-bottom: 2rem;
    }

    .search-input-wrapper {
        position: relative;
    }

    .search-input-container {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 12px;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
    }

    .search-input-container:focus-within {
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        background: #fff;
    }

    /* 搜索历史样式 */
    .search-history {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10;
        margin-top: 4px;
    }

    .search-history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
    }

    .history-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #555;
    }

    .history-icon {
        width: 16px;
        height: 16px;
        color: #666;
    }

    .clear-all-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .clear-all-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
    }

    .clear-all-btn svg {
        width: 14px;
        height: 14px;
    }

    .search-history-list {
        max-height: 240px;
        overflow-y: auto;
    }

    .history-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
    }

    .history-item:last-child {
        border-bottom: none;
    }

    .history-item-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s ease;
        color: #333;
    }

    .history-item-content:hover {
        background: #f8f9fa;
    }

    .history-item-icon {
        width: 16px;
        height: 16px;
        color: #888;
        flex-shrink: 0;
    }

    .history-text {
        flex: 1;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .remove-history-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-right: 0.5rem;
        border-radius: 4px;
    }

    .remove-history-btn:hover {
        background: #fee;
        color: #dc3545;
    }

    .remove-history-btn svg {
        width: 14px;
        height: 14px;
    }

    .search-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 1rem;
        padding: 0.5rem;
        outline: none;
        color: #333;
        min-width: 0;
    }

    .search-input::placeholder {
        color: #888;
    }

    .search-type-select {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 0.5rem;
        font-size: 0.9rem;
        color: #555;
        outline: none;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
    }

    .search-type-select:focus {
        border-color: #0066cc;
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .search-type-select:hover {
        border-color: #999;
    }

    .search-buttons {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .search-type-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.5rem 1rem;
        background: #e8f4fd;
        border-radius: 6px;
        border: 1px solid #bee5eb;
        font-size: 0.9rem;
        color: #0c5460;
    }

    .info-icon {
        font-size: 1rem;
    }

    .search-tips-note {
        margin-top: 1rem;
        padding: 1rem;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .search-tips-note p {
        margin: 0;
        color: #856404;
    }

    .search-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #0066cc;
        color: white;
    }

    .search-btn:hover:not(:disabled) {
        background: #0052a3;
        transform: translateY(-1px);
    }

    .search-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
    }

    .search-btn svg {
        width: 16px;
        height: 16px;
    }

    .error-message {
        background-color: #fee;
        color: #c33;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #fcc;
        margin-bottom: 1rem;
    }

    .results-header {
        margin-bottom: 1.5rem;
    }

    .results-header h2 {
        color: #333;
        margin-bottom: 0.5rem;
    }

    .results-count {
        color: #666;
        margin: 0;
    }

    .search-term {
        font-weight: bold;
        color: #0066cc;
    }

    .articles-grid {
        display: grid;
        gap: 1.5rem;
    }

    .no-results {
        text-align: center;
        padding: 2rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }

    .no-results h2 {
        color: #666;
        margin-bottom: 1rem;
    }

    .no-results p {
        color: #888;
        margin-bottom: 1rem;
    }

    .search-tips {
        font-weight: bold;
        color: #555;
        margin-bottom: 0.5rem;
    }

    .tips-list {
        text-align: left;
        display: inline-block;
        color: #666;
    }

    .tips-list li {
        margin-bottom: 0.25rem;
    }

    .search-tips-initial {
        background-color: #f0f8ff;
        padding: 2rem;
        border-radius: 8px;
        border: 1px solid #e1e8f0;
    }

    .search-tips-initial h2 {
        color: #0066cc;
        margin-bottom: 1rem;
    }

    .search-tips-initial p {
        color: #555;
        margin-bottom: 1rem;
    }

    .search-tips-initial ul {
        color: #666;
    }

    .search-tips-initial li {
        margin-bottom: 0.5rem;
    }

    /* 响应式设计 */
    @media (max-width: 640px) {
        .search-page {
            padding: 1rem 0.5rem;
        }

        .search-input-container {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
        }

        .search-input {
            order: 1;
        }

        .search-type-select {
            order: 2;
            width: 100%;
        }

        .search-buttons {
            order: 3;
            justify-content: center;
        }

        .search-btn {
            flex: 1;
            justify-content: center;
        }

        .search-type-info {
            text-align: center;
        }

        /* 搜索历史响应式 */
        .search-history {
            left: -0.5rem;
            right: -0.5rem;
        }

        .search-history-header {
            padding: 0.5rem 0.75rem;
        }

        .history-title {
            font-size: 0.85rem;
        }

        .clear-all-btn {
            font-size: 0.75rem;
            padding: 0.2rem 0.4rem;
        }

        .history-item-content {
            padding: 0.6rem 0.75rem;
        }

        .history-text {
            font-size: 0.85rem;
        }
    }

    @media (max-width: 480px) {
        .search-input-container {
            padding: 0.75rem;
        }

        .search-btn {
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
        }

        .search-type-select {
            font-size: 0.85rem;
            padding: 0.4rem;
        }

        .search-history-list {
            max-height: 200px;
        }
    }
</style>
