const config = {
  title: {
    template: '%s - The Blog of Lény Sauzet',
    default: 'The Blog of Lény Sauzet',
  },
  description: "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own.",

  generator: 'Next.js',
  applicationName: "Lény's Blog",
  referrer: 'origin-when-cross-origin',
  keywords: ['Lény Sauzet', 'Innovation Engineer', 'Software Engineer', 'Full Stack Developer', 'Blog', 'AI Engineer', 'Modern Web Architecture', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Creative Coding', '3D Web Development', 'Game Development', 'Tech Devlog', 'Programming Tutorials', 'Software Engineering Insights', 'Coding Experiments'],
  authors: [{ name: 'Lény Sauzet', url: 'https://lenysauzet.com' }],
  creator: 'Lény Sauzet',
  publisher: 'Lény Sauzet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  metadataBase: new URL('https://blog.lenysauzet.com'),
  alternates: {
    canonical: '/',
  }


  // pathPrefix: '/',
  // keywords: [
  // ],
  // title: 'The Blog of Lény Sauzet',
  // titleAlt: 'The Blog of Lény Sauzet',
  // description:
  //   "Hi I'm Lény, and this is my blog. In here, you'll find all the articles I wished I had when I was learning about web development, shaders, real-time 3D on the web, and more.  Each piece I write aims to dive deep into the topics I'm passionate about, while also making complex topics more accessible through interactive playgrounds, visualization, and well detailed walkthroughs. My goal is to give you the tools and intuition to explore further on your own.",
  // url: 'https://blog.lenysauzet.com', // Site domain without trailing slash
  // siteUrl: 'https://blog.lenysauzet.com/', // url + pathPrefix
  // siteLanguage: 'en', // Language Tag on <html> element
  // logo: 'src/static/logo/logo.png',
  // image: 'https://blog.lenysauzet.com/static/og/main-og-image.png',
  // favicon: 'static/favicon.png', // Manifest favicon generation
  // shortName: 'Lény Sauzet', // Shortname for manifest, must be shorter than 12 characters
  // author: 'Lény Sauzet', // Author for schemaORGJSONLD
  // themeColor: '#000000',
  // backgroundColor: '#ffffff',
  // twitter: '@LenySauzet', // Twitter Username
  // twitterDesc:
  //   'Lény Sauzet is a lead frontend engineer and space enthusiast currently based in New York.',
};
export default config;
