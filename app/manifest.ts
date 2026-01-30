import siteConfig from '@/config/site'
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const { manifest: m } = siteConfig
  return {
    name: m.name,
    short_name: m.short_name,
    description: m.description,
    start_url: m.start_url,
    display: m.display,
    background_color: m.background_color,
    theme_color: m.theme_color,
    icons: m.icons,
  }
}