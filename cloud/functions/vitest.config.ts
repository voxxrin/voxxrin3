import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        include: [
            `src/**/*.spec.ts`
        ]
    },
    resolve: {
        alias: {
            '@shared': resolve(__dirname, '../../shared/dist')
        }
    }
})
