import siteConfig from '@/config/site'
import { getPosts } from '@/lib/post-utils'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url
  const posts = await getPosts()

  const blogPosts = posts.map((post) => {
      return {
        url: `${baseUrl}/posts/${post.slug}`,
        lastModified: post.lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    })

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ]

  return [...staticPages, ...blogPosts]
}