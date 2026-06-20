import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type { Request, Response, NextFunction } from 'express';

export const searchRouter = Router();

const auth = requireAuth as unknown as (req: Request, res: Response, next: NextFunction) => void;

// ─── Types for raw query result ───────────────────────────────────────────────

interface SearchRow {
  id: string;
  title: string;
  language: string;
  description: string | null;
  rank: number;
  collection_name: string;
  collection_id: string;
}

// ─── GET /search?q=&lang=&collectionId= ──────────────────────────────────────

searchRouter.get('/', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
    const lang = typeof req.query['lang'] === 'string' ? req.query['lang'].trim() : undefined;
    const collectionId =
      typeof req.query['collectionId'] === 'string' ? req.query['collectionId'].trim() : undefined;

    if (!q) {
      throw new ApiError(400, 'Query parameter "q" is required');
    }

    // Full-text search via PostgreSQL tsvector.
    // Users can only see snippets in collections where they have a permission row,
    // OR collections that are public.
    let results: SearchRow[];

    if (lang && collectionId) {
      results = await prisma.$queryRaw<SearchRow[]>`
        SELECT
          s.id,
          s.title,
          s.language,
          s.description,
          ts_rank(s.search_vector, plainto_tsquery('english', ${q})) AS rank,
          c.name AS collection_name,
          c.id   AS collection_id
        FROM snippets s
        JOIN collections c ON s.collection_id = c.id
        WHERE
          (
            c.is_public = TRUE
            OR EXISTS (
              SELECT 1 FROM permissions p
              WHERE p.collection_id = c.id AND p.user_id = ${userId}
            )
          )
          AND s.search_vector @@ plainto_tsquery('english', ${q})
          AND s.language      = ${lang}
          AND s.collection_id = ${collectionId}
        ORDER BY rank DESC
        LIMIT 20
      `;
    } else if (lang) {
      results = await prisma.$queryRaw<SearchRow[]>`
        SELECT
          s.id,
          s.title,
          s.language,
          s.description,
          ts_rank(s.search_vector, plainto_tsquery('english', ${q})) AS rank,
          c.name AS collection_name,
          c.id   AS collection_id
        FROM snippets s
        JOIN collections c ON s.collection_id = c.id
        WHERE
          (
            c.is_public = TRUE
            OR EXISTS (
              SELECT 1 FROM permissions p
              WHERE p.collection_id = c.id AND p.user_id = ${userId}
            )
          )
          AND s.search_vector @@ plainto_tsquery('english', ${q})
          AND s.language = ${lang}
        ORDER BY rank DESC
        LIMIT 20
      `;
    } else if (collectionId) {
      results = await prisma.$queryRaw<SearchRow[]>`
        SELECT
          s.id,
          s.title,
          s.language,
          s.description,
          ts_rank(s.search_vector, plainto_tsquery('english', ${q})) AS rank,
          c.name AS collection_name,
          c.id   AS collection_id
        FROM snippets s
        JOIN collections c ON s.collection_id = c.id
        WHERE
          (
            c.is_public = TRUE
            OR EXISTS (
              SELECT 1 FROM permissions p
              WHERE p.collection_id = c.id AND p.user_id = ${userId}
            )
          )
          AND s.search_vector @@ plainto_tsquery('english', ${q})
          AND s.collection_id = ${collectionId}
        ORDER BY rank DESC
        LIMIT 20
      `;
    } else {
      results = await prisma.$queryRaw<SearchRow[]>`
        SELECT
          s.id,
          s.title,
          s.language,
          s.description,
          ts_rank(s.search_vector, plainto_tsquery('english', ${q})) AS rank,
          c.name AS collection_name,
          c.id   AS collection_id
        FROM snippets s
        JOIN collections c ON s.collection_id = c.id
        WHERE
          (
            c.is_public = TRUE
            OR EXISTS (
              SELECT 1 FROM permissions p
              WHERE p.collection_id = c.id AND p.user_id = ${userId}
            )
          )
          AND s.search_vector @@ plainto_tsquery('english', ${q})
        ORDER BY rank DESC
        LIMIT 20
      `;
    }

    // Prisma returns BigInt for numeric results in some drivers; normalise rank to float
    const normalised = results.map((r) => ({
      ...r,
      rank: typeof r.rank === 'bigint' ? Number(r.rank) : r.rank,
    }));

    res.json({ results: normalised, total: normalised.length });
  } catch (err) {
    next(err);
  }
});

// ─── Migration helper: trigger search_vector update ──────────────────────────
// Call this after INSERT/UPDATE on snippets via a DB trigger, or invoke manually.
// Example trigger SQL (run once in a migration):
//
//   CREATE OR REPLACE FUNCTION snippets_search_vector_update() RETURNS trigger AS $$
//   BEGIN
//     NEW.search_vector :=
//       setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
//       setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
//       setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
//     RETURN NEW;
//   END
//   $$ LANGUAGE plpgsql;
//
//   CREATE TRIGGER snippets_search_vector_trigger
//   BEFORE INSERT OR UPDATE ON snippets
//   FOR EACH ROW EXECUTE FUNCTION snippets_search_vector_update();
//
//   CREATE INDEX snippets_search_vector_idx ON snippets USING GIN (search_vector);

export async function updateSearchVector(snippetId: string): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE snippets
    SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(content, '')), 'C')
    WHERE id = ${snippetId}
  `);
}
