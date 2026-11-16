import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatLedgerDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}.${month}.${day}`;
}

export function estimateReadTime(body?: string): string {
	if (!body) return '1 MIN READ';
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	const minutes = Math.max(1, Math.ceil(words / 200));
	return `${minutes} MIN READ`;
}

export function getAllTags(posts: BlogPost[]): string[] {
	const set = new Set<string>();
	posts.forEach((post) => {
		post.data.tags.forEach((tag) => set.add(tag.toLowerCase()));
	});
	return Array.from(set).sort();
}
