<script lang="ts">
import { goto } from "$app/navigation";
let {data}=$props();

function toArticlesLists()
{
    goto("/my/articles");
}
function toEditmyprofile()
{
    goto("my/profile");
}
</script>

<div>
    用户名: {data.user?.name}
</div>

<div>
    用户邮箱： {data.user?.email}
</div>

<div>
    <button 
    type="button"
    on:click={toArticlesLists}
    class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
    >
    我的文章
    </button>
</div>

<div>
    <button
    type="button"
    on:click={toEditmyprofile}
    class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
    >
    编辑我的资料
    </button>
</div>