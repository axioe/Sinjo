import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['playwright.config.js', 'tests/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Playwright 테스트 코드는 Node 에서 실행된다(process.env 등을 쓴다) - 리액트 전용
  // 규칙(react-hooks/react-refresh)도 여기엔 해당하지 않는다. 다만 page.addInitScript
  // 등에 넘기는 콜백은 브라우저 컨텍스트 안에서 실행되므로 window 도 함께 허용한다.
  {
    files: ['playwright.config.js', 'tests/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
