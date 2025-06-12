import { json } from "@sveltejs/kit";
import { deleteSessionById } from "$lib/server/db/sessionCollection";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
    const sessionId = cookies.get("sessionId");

    if (!sessionId) {
        return json({ success: false, message: "未找到会话，您可能已经登出。" }, { status: 400 });
    }

    try {
        const { error } = await deleteSessionById(sessionId);

        if (error) {
            console.error("Error deleting session:", error.message);
            return json({ success: false, message: "登出失败，请稍后重试。" }, { status: 500 });
        }

        // 删除会话 Cookie
        cookies.delete("sessionId", { path: "/" });

        return json({ success: true, message: "登出成功！" }, { status: 200 });
    } catch (err) {
        console.error("Unexpected error during logout:", err);
        return json({ success: false, message: "服务器内部错误，请稍后重试。" }, { status: 500 });
    }
};
