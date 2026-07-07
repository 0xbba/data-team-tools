import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "post-build",
      closeBundle() {
        const outDir = path.resolve(__dirname, "server/public");
        const indexPath = path.join(outDir, "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        // 收集所有JS文件内容
        const jsFiles: string[] = [];
        html = html.replace(/<script[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (_, src) => {
          const filePath = path.join(outDir, src);
          if (fs.existsSync(filePath)) jsFiles.push(fs.readFileSync(filePath, "utf-8"));
          return '';
        });
        // 移除 modulepreload link（JS已内联）
        html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>\s*/g, '');
        // 内联CSS
        html = html.replace(/<link[^>]*href="([^"]+)"[^>]*>/g, (match, href) => {
          if (!href.endsWith('.css')) return match;
          const filePath = path.join(outDir, href);
          if (fs.existsSync(filePath)) {
            const css = fs.readFileSync(filePath, "utf-8");
            return `<style>${css}</style>`;
          }
          return match;
        });
        // 内联JS
        if (jsFiles.length > 0) {
          html = html.replace("</body>", () =>
            `<script type="module">${jsFiles.join('\n')}</script>\n</body>`
          );
        }
        const singleHtmlPath = path.resolve(__dirname, "../字段翻译工具.html");
        try {
          fs.writeFileSync(singleHtmlPath, html);
        } catch (e) {
          console.warn(`[post-build] 无法写入外部单文件: ${(e as Error).message}`);
        }
        fs.writeFileSync(path.join(outDir, "单机版.html"), html);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "server/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
});
