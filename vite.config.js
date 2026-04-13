import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getBase() {
  if (!process.env.GITHUB_ACTIONS) return '/';

  const repo = process.env.GITHUB_REPOSITORY || '';
  const repoName = repo.split('/')[1] || '';
  return repoName ? `/${repoName}/` : '/';
}

export default defineConfig({
  base: getBase(),
  plugins: [react()]
});
