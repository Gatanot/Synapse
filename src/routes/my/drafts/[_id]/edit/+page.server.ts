// src/routes/my/drafts/[_id]/edit/+page.server.ts
import type { PageServerLoad } from './$types';
import { getArticleById } from '$lib/server/db/articleCollection';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  // 检查用户是否已登录
  if (!locals.user) {
    throw error(401, 'Unauthorized: You must be logged in to edit drafts.');
  }

  const draftId = params._id;
  if (!draftId) {
    throw error(400, 'Draft ID is required');
  }

  // 获取草稿文章
  const { data: draft, error: dbError } = await getArticleById(draftId);
  
  if (dbError || !draft) {
    throw error(404, 'Draft not found');
  }

  // 检查是否是草稿的作者
  if (draft.authorId.toString() !== locals.user._id) {
    throw error(403, 'You are not the author of this draft');
  }

  // 检查文章状态是否为草稿
  if (draft.status !== 'draft') {
    throw error(400, 'This article is not a draft');
  }

  return {
    draft: {
      _id: draft._id.toString(),
      title: draft.title,
      summary: draft.summary,
      tags: draft.tags,
      authorId: draft.authorId.toString(),
      authorName: draft.authorName,
      body: draft.body,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      status: draft.status,
      likes: draft.likes || 0
    },
    user: locals.user
  };
};
