// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  results;
  currentId;
  constructor() {
    this.results = /* @__PURE__ */ new Map();
    this.currentId = 1;
  }
  async createUrlResult(result) {
    const id = this.currentId++;
    const urlResult = { ...result, id };
    this.results.set(id, urlResult);
    return urlResult;
  }
  async createMoreTagResult(result) {
    const id = this.currentId++;
    const moreTagResult = { ...result, id };
    this.results.set(id, moreTagResult);
    return moreTagResult;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { z } from "zod";
var urlResults = pgTable("url_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  h1Texts: text("h1_texts").array(),
  error: text("error")
});
var moreTagResults = pgTable("more_tag_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  h1Texts: text("h1_texts").array(),
  h2Texts: text("h2_texts").array(),
  h3Texts: text("h3_texts").array(),
  error: text("error")
});
var insertUrlSchema = z.object({
  urls: z.string().array()
});

// server/routes.ts
import axios from "axios";
import { load } from "cheerio";
async function registerRoutes(app2) {
  app2.post("/api/extract-h1", async (req, res) => {
    try {
      const { urls } = insertUrlSchema.parse(req.body);
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
            const response = await axios.get(normalizedUrl);
            const $ = load(response.data);
            const h1Texts = $("h1").map((_, el) => $(el).text().trim()).get();
            if (h1Texts.length === 0) {
              return storage.createUrlResult({
                url: normalizedUrl,
                h1Texts: [],
                error: "No H1 tags found"
              });
            }
            return storage.createUrlResult({
              url: normalizedUrl,
              h1Texts,
              error: null
            });
          } catch (error) {
            return storage.createUrlResult({
              url,
              h1Texts: [],
              error: "Failed to fetch URL"
            });
          }
        })
      );
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });
  app2.post("/api/extract-more", async (req, res) => {
    try {
      const { urls } = insertUrlSchema.parse(req.body);
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
            const response = await axios.get(normalizedUrl);
            const $ = load(response.data);
            const h1Texts = $("h1").map((_, el) => $(el).text().trim()).get();
            const h2Texts = $("h2").map((_, el) => $(el).text().trim()).get();
            const h3Texts = $("h3").map((_, el) => $(el).text().trim()).get();
            if (h1Texts.length === 0 && h2Texts.length === 0 && h3Texts.length === 0) {
              return storage.createMoreTagResult({
                url: normalizedUrl,
                h1Texts: [],
                h2Texts: [],
                h3Texts: [],
                error: "No heading tags found"
              });
            }
            return storage.createMoreTagResult({
              url: normalizedUrl,
              h1Texts,
              h2Texts,
              h3Texts,
              error: null
            });
          } catch (error) {
            return storage.createMoreTagResult({
              url,
              h1Texts: [],
              h2Texts: [],
              h3Texts: [],
              error: "Failed to fetch URL"
            });
          }
        })
      );
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });
  return createServer(app2);
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
