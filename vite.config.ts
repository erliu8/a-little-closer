import { defineConfig } from 'vite'

// 相对路径允许相同的构建产物放在 itch.io 子目录或桌面 WebView 内。
export default defineConfig({ base: './' })
