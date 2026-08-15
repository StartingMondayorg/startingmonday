import { BLOG_POSTS_A, type BlogPostMeta } from './blog-posts-data-a'
import { BLOG_POSTS_B } from './blog-posts-data-b'

export type { BlogPostMeta }

export const BLOG_POSTS: BlogPostMeta[] = [...BLOG_POSTS_A, ...BLOG_POSTS_B]

export function getPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}

export function getRelated(slug: string): BlogPostMeta[] {
  const post = getPost(slug)
  if (!post?.related) return []
  return post.related.map(s => getPost(s)).filter(Boolean) as BlogPostMeta[]
}
