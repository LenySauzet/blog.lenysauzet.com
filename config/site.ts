import type { Metadata } from 'next'

// urls and identity
const url = 'https://blog.lenysauzet.com'
const authorUrl = 'https://lenysauzet.com'

// text content
const title = {
  template: '%s - The Blog of Lény Sauzet',
  default: 'The Blog of Lény Sauzet',
}

const description =
  "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own."

// short version for rss and meta
const descriptionShort =
  "Hi I'm Lény, and this is my blog. Articles about web development, shaders, real-time 3D, creative coding, and software engineering."

// author and social
const author = {
  name: 'Lény Sauzet',
  url: authorUrl,
}

const twitter = {
  handle: '@LenySauzet',
  card: 'summary_large_image' as const,
}

// seo keywords and settings
const keywords = [
  'Lény Sauzet',
  'Innovation Engineer',
  'Software Engineer',
  'Full Stack Developer',
  'Blog',
  'AI Engineer',
  'Modern Web Architecture',
  'Mobile App Development',
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Creative Coding',
  '3D Web Development',
  'Game Development',
  'Tech Devlog',
  'Programming Tutorials',
  'Software Engineering Insights',
  'Coding Experiments',
]

const category = 'technology'

const formatDetection = {
  email: false,
  address: false,
  telephone: false,
}

const robots = {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    noimageindex: false,
    'max-video-preview': -1,
    'max-image-preview': 'large' as const,
    'max-snippet': -1,
  },
}

// default open graph and twitter
const openGraph = {
  siteName: title.default,
  locale: 'en_US' as const,
  type: 'website' as const,
  images: [
    {
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: title.default,
    },
  ],
}

const twitterImages = ['/twitter-image.png']

// specific pages
const pages = {
  home: {
    title: 'Latest Posts',
    description:
      "Latest articles from Lény Sauzet's blog: web development, shaders, real-time 3D, creative coding, and software engineering insights.",
    openGraphTitle: `Latest Posts - ${title.default}`,
  },
}

// manifest for pwa
const manifest = {
  name: title.default,
  short_name: 'Blog',
  description,
  start_url: '/',
  display: 'standalone' as const,
  background_color: '#09090b',
  theme_color: '#1f3fad',
  icons: [
    { src: '/static/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' as const },
    { src: '/static/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' as const },
  ],
}

// rss feed
const rss = {
  channelTitle: title.default,
  channelDescription: descriptionShort,
  language: 'en-US',
}

// site config object
const siteConfig = {
  url,
  title,
  description,
  descriptionShort,
  author,
  twitter,
  keywords,
  category,
  formatDetection,
  robots,
  openGraph,
  twitterImages,
  pages,
  manifest,
  rss,
  // for article metadata
  authorName: author.name,
  siteName: title.default,
}

export default siteConfig

// root metadata helper for Next.js layout
export function getRootMetadata(): Metadata {
  return {
    title: {
      template: title.template,
      default: title.default,
    },
    description,
    generator: 'Next.js',
    applicationName: "Lény's Blog",
    referrer: 'origin-when-cross-origin',
    keywords,
    authors: [{ name: author.name, url: author.url }],
    creator: author.name,
    publisher: author.name,
    category,
    formatDetection,
    metadataBase: new URL(url),
    alternates: {
      canonical: '/',
      types: { 'application/rss+xml': '/rss' },
    },
    robots,
    openGraph: {
      title: title.default,
      description,
      url,
      siteName: openGraph.siteName,
      locale: openGraph.locale,
      type: openGraph.type,
      images: openGraph.images,
    },
    twitter: {
      card: twitter.card,
      title: title.default,
      description,
      creator: twitter.handle,
      images: twitterImages,
    },
    // verification: {
    //   google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    //   yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
    // },
  }
}
