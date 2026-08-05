import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    // A producao (Vercel) roda em UTC. Sem fixar isto, a suite roda no fuso da
    // maquina de quem desenvolve (America/Sao_Paulo) e NAO exerce o ambiente
    // real: os 2 testes da janela de agendamento passavam aqui e falhavam em
    // producao havia semanas (BUG-093). Um portao que nao exerce o ambiente de
    // producao nao e um portao (Licao 14).
    env: { TZ: 'UTC' },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `'node_modules'` (sem glob) casa SO com a pasta da raiz. Quando surgiu um
    // git worktree em `.claude/worktrees/`, a suite passou a varrer o
    // `node_modules` de dentro dele e a rodar teste de biblioteca de terceiros
    // (zod, svix, tailwind/typography) — 61 falhas que nao sao do projeto. O
    // worktree tambem traz uma copia inteira do repo, que duplicava a suite.
    exclude: ['**/node_modules/**', 'scripts/**', '.claude/**'],
  },
})
