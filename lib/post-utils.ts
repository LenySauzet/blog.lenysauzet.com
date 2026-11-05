import fs from 'fs/promises'
import path from 'path'

export type Post = {
    slug: string
    metadata: {
        title: string
        /** For the island, which has far less room than a page. */
        shortTitle?: string
        description: string
        date: string
        updated?: string
        tags: string[]
        draft?: boolean
    }
    content: string,
    lastModified: Date
}

export type PostSummary = {
    slug: string
    title: string
    description: string
    date: string
}

export const summaryOf = ({ slug, metadata }: Post): PostSummary => ({
    slug,
    title: metadata.shortTitle ?? metadata.title,
    description: metadata.description,
    date: metadata.date,
})

type GetPostsOptions = {
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
