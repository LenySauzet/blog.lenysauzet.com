import type { SandpackFiles } from '@codesandbox/sandpack-react';

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
