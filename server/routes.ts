import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUrlSchema } from "@shared/schema";
import axios from "axios";
import { load } from "cheerio";

export async function registerRoutes(app: Express) {
  app.post("/api/extract-h1", async (req, res) => {
    try {
      const { urls } = insertUrlSchema.parse(req.body);

      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            // Add protocol if missing
            const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

            const response = await axios.get(normalizedUrl);
            const $ = load(response.data);
            const h1Texts = $("h1").map((_, el) => $(el).text().trim()).get();

            if (h1Texts.length === 0) {
              return storage.createUrlResult({
                url: normalizedUrl,
                h1Texts: [],
                error: "No H1 tags found",
              });
            }

            return storage.createUrlResult({
              url: normalizedUrl,
              h1Texts,
              error: null,
            });
          } catch (error) {
            return storage.createUrlResult({
              url,
              h1Texts: [],
              error: "Failed to fetch URL",
            });
          }
        }),
      );

      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/extract-more", async (req, res) => {
    try {
      const { urls } = insertUrlSchema.parse(req.body);

      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            // Add protocol if missing
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
                error: "No heading tags found",
              });
            }

            return storage.createMoreTagResult({
              url: normalizedUrl,
              h1Texts,
              h2Texts,
              h3Texts,
              error: null,
            });
          } catch (error) {
            return storage.createMoreTagResult({
              url,
              h1Texts: [],
              h2Texts: [],
              h3Texts: [],
              error: "Failed to fetch URL",
            });
          }
        }),
      );

      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  return createServer(app);
}