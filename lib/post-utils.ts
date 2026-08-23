import fs from 'fs/promises'
import path from 'path'

type Post = {
    slug: string
    metadata: {
        title: string
        description: string
        date: string
        /** Optional, and only set by hand: the day the post last changed in a way
            worth telling a reader about. */
        updated?: string
        tags: string[]
        /** Reachable by URL but hidden from every public listing. */
        draft?: boolean
    }
    content: string,
    lastModified: Date
}

type GetPostsOptions = {
    /** Off by default so the feed, RSS and sitemap never leak drafts. */
    includeDrafts?: boolean
}

export const getPosts = async ({ includeDrafts = false }: GetPostsOptions = {}): Promise<Post[]> => {
    const contentDir = path.join(process.cwd(), 'content')
    const files = await fs.readdir(contentDir)
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'))

    const posts = await Promise.all(
        mdxFiles.map(async (file) => {
            const slug = path.parse(file).name
            const { metadata } = await import(`@/content/${slug}.mdx`)
            const stats = await fs.stat(path.join(contentDir, file))
            return {
                slug,
                metadata,
                content: await fs.readFile(path.join(contentDir, file), 'utf8'),
                lastModified: stats.mtime
            }
        })
    )

    const visible = includeDrafts
        ? posts
        : posts.filter((post) => !post.metadata.draft)

    visible.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());

    return visible
}
