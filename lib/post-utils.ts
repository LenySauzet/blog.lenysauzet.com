import fs from 'fs/promises'
import path from 'path'

type Post = {
    slug: string
    metadata: {
        title: string
        description: string
        date: string
        tags: string[]
    }
    content: string,
    lastModified: Date
}
export const getPosts = async (): Promise<Post[]> => {
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

    posts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
    
    return posts
}
