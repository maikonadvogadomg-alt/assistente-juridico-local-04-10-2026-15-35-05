/**
 * Mostra a TELA do app no mesmo endereço do servidor.
 * Era isto que faltava: o servidor só tinha as rotas /api, então no PC
 * aparecia "Cannot GET /" ou "404 com metade de um HTML".
 *  - Montado (npm run build → pasta dist/): serve os arquivos prontos.
 *  - Sem montar (modo de desenvolvimento): usa o Vite por dentro.
 */
import express, { type Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

export async function setupWeb(app: Express, httpServer: Server) {
  // /api que não existe responde em JSON (nunca uma página HTML)
  app.use("/api", (req, res) => {
    res.status(404).json({ message: `Rota não encontrada: ${req.method} /api${req.path}` });
  });

  const built = fs.existsSync(path.join(DIST, "index.html"));
  if (process.env.NODE_ENV === "production" && built) {
    app.use(express.static(DIST, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(path.join(DIST, "index.html"));
    });
    return;
  }

  const { createServer } = await import("vite");
  const vite = await createServer({
    configFile: path.join(ROOT, "vite.config.ts"),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    try {
      const raw = await fs.promises.readFile(path.join(ROOT, "client", "index.html"), "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, raw);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
