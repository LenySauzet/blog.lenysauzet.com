import type { SandpackFiles } from '@codesandbox/sandpack-react';

// Overrides the react template's stylesheet so previews centre in the pane and
// inherit the site's sans font. Hidden from the editor tabs.
const stylesCss = `body {
  margin: 0;
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
}
`;

export const reactSetupFiles: SandpackFiles = {
  '/styles.css': { code: stylesCss, hidden: true },
};
