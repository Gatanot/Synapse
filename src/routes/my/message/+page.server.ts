import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/message');
  const data = await res.json();
  return {
    messages: data.data ?? []
  };
};
