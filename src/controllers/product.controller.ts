import type { RequestHandler } from "express";
import { decodeCursor, encodeCursor } from "../utils/cursor.js";
import { pool } from "../config/db.js";

export const productHandler: RequestHandler = async (req, res) => {
  try {
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;

    const requestedLimit = Number(req.query.limit);

    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    // Fetch one extra record to determine if another page exists
    const queryLimit = limit + 1;

    const category = req.query.category as string | undefined;

    let snapshot = req.query.snapshot as string | undefined;
    const cursor = req.query.cursor as string | undefined;

    // First request gets a snapshot timestamp
    if (!snapshot) {
      snapshot = new Date().toISOString();
    }

    let query = "";
    let values: unknown[] = [];

    if (!cursor) {
      query = `
        SELECT *
        FROM products
        WHERE
          ($1::text IS NULL OR category = $1)
          AND updated_at <= $2
        ORDER BY updated_at DESC, id DESC
        LIMIT $3
      `;

      values = [category ?? null, snapshot, queryLimit];
    } else {
      const decoded = decodeCursor(cursor);

      query = `
        SELECT *
        FROM products
        WHERE
          ($1::text IS NULL OR category = $1)
          AND updated_at <= $2
          AND (
            updated_at < $3
            OR (
              updated_at = $3
              AND id < $4
            )
          )
        ORDER BY updated_at DESC, id DESC
        LIMIT $5
      `;

      values = [
        category ?? null,
        snapshot,
        decoded.updated_at,
        decoded.id,
        queryLimit,
      ];
    }

    const result = await pool.query(query, values);

    const hasNextPage = result.rows.length > limit;

    const products = hasNextPage
      ? result.rows.slice(0, limit)
      : result.rows;

    let nextCursor: string | null = null;

    if (hasNextPage && products.length > 0) {
      const last = products[products.length - 1];

      nextCursor = encodeCursor({
        updated_at: last.updated_at,
        id: last.id,
      });
    }

    return res.status(200).json({
      snapshot,
      nextCursor,
      hasNextPage,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};