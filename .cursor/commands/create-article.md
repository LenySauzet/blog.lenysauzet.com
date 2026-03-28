---
alwaysApply: false
---

# Create New Blog Article

Create a new MDX blog post file in the `content/` directory.

## Required Inputs

1. **Title**: Ask the user for the article title
2. **Description**: Ask for a short SEO description (1-2 sentences)
3. **Tags**: Ask for an array of tags (e.g. `['webgl', 'shaders']`)
4. **Date**: Ask for the publication date (format: YYYY-MM-DD), default to today

## Instructions

1. Ask the user for the **title** of the article
2. Ask for a short **description** (used in SEO meta and the post list)
3. Ask for **tags** (comma-separated, will be formatted as an array)
4. Ask for the **publication date** (default: today's date)
5. Generate the slug from the title:
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters (keep only alphanumeric and hyphens)
   - Example: "My Amazing Article!" → `my-amazing-article`
6. Create the MDX file at `content/{slug}.mdx` using the template below

## Template

```mdx
export const metadata = {
  title: '{title}',
  description: '{description}',
  tags: [{tags}],
  date: '{date}',
};

{/* Start writing your article here */}
```

## Key Rules

- **No `slug` field** in metadata — the slug comes from the filename
- **No YAML frontmatter** — this project uses JS `export const metadata = {}` syntax
- **Date format**: `YYYY-MM-DD` (e.g. `2026-04-21`)
- Tags should be lowercase strings in an array

## Example

For title "Building a Ray Marcher in OGL", description "A step-by-step guide to ray marching in OGL with GLSL shaders.", tags "webgl, shaders, ogl", date "2026-05-10":

- File: `content/building-a-ray-marcher-in-ogl.mdx`
- Result:

```mdx
export const metadata = {
  title: 'Building a Ray Marcher in OGL',
  description: 'A step-by-step guide to ray marching in OGL with GLSL shaders.',
  tags: ['webgl', 'shaders', 'ogl'],
  date: '2026-05-10',
};

{/* Start writing your article here */}
```
