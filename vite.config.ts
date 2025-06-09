import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['bcryptjs']
	}, optimizeDeps: {
		// 解决客户端依赖预构建时，与 esbuild 不兼容的问题
		// bcryptjs 是一个纯服务端的库，不应该也不需要在浏览器端被优化或使用。
		// 将其排除可以防止 Vite 尝试在客户端环境中处理它。
		exclude: ['bcryptjs']
	}
});
