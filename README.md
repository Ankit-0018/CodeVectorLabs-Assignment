# Product Browser API

Backend task submission for CodeVector.

A high-performance product browsing API that supports:

* 200,000+ products
* Fast pagination
* Category filtering
* Consistent browsing while data changes
* PostgreSQL indexing

---

# Live Demo

```text
<YOUR_RENDER_URL>
```

---

# Tech Stack

| Technology | Purpose           |
| ---------- | ----------------- |
| Node.js    | Runtime           |
| TypeScript | Type Safety       |
| Express    | API Framework     |
| PostgreSQL | Database          |
| Supabase   | Hosted PostgreSQL |
| pg         | PostgreSQL Client |

---

# Features

* Cursor-based pagination
* Category filtering
* Snapshot-based consistency
* Efficient PostgreSQL indexing
* Seed script for generating 200,000 products
* Limit protection (max page size)
* Invalid cursor handling
* Health check endpoint

---

# Project Structure

```text
src/
├── config/
│   └── db.ts
├── routes/
│   └── products.ts
├── utils/
│   └── cursor.ts
├── scripts/
│   └── seed.ts
└── server.ts
```

---

# Assumptions

Since the assignment intentionally leaves some requirements open-ended, I made the following assumptions:

* Products should be shown newest first.
* Category filtering is optional.
* Browsing consistency is more important than immediately showing newly inserted products.
* A user should never see duplicate products while paging.
* A user should never miss products that existed when they started browsing.

---

# Database Schema

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

---

# Index Strategy

```sql
CREATE INDEX idx_products_browse
ON products (
    category,
    updated_at DESC,
    id DESC
);
```

## Why this index?

The API frequently performs:

1. Category filtering
2. Sorting by newest products
3. Cursor pagination

This composite index allows PostgreSQL to efficiently execute these operations without performing full table scans.

---

# Seed Script

The database contains 200,000 products.

Instead of inserting records one-by-one from Node.js, PostgreSQL's `generate_series()` function is used to generate data directly inside the database.

Benefits:

* Faster execution
* Minimal network overhead
* Better scalability
* Demonstrates database-side data generation

Run:

```bash
npm run seed
```

---

# Pagination Design

## Why Not OFFSET Pagination?

Traditional pagination:

```sql
SELECT *
FROM products
ORDER BY updated_at DESC
LIMIT 20 OFFSET 100000;
```

Problems:

* Query cost increases as the offset grows.
* The database must scan and skip large numbers of rows.
* Data changes during browsing can create duplicates or missing records.

---

## Cursor-Based Pagination

Products are sorted by:

```sql
ORDER BY updated_at DESC, id DESC
```

The API returns a cursor representing the last product from the current page.

Example cursor:

```json
{
  "updated_at": "2026-06-23T12:00:00Z",
  "id": 12345
}
```

The next page begins immediately after that record.

Benefits:

* Stable performance regardless of dataset size.
* Efficient index usage.
* No large OFFSET scans.

---

# Why Use `(updated_at, id)` Instead of Only `updated_at`?

Multiple products may share the same timestamp.

Example:

```text
id    updated_at

10    12:00
9     12:00
8     12:00
```

Using only `updated_at` can cause skipped records.

Including both:

```text
(updated_at, id)
```

guarantees stable ordering and prevents missing products.

---

# Consistency While Data Changes

The assignment specifically requires:

> If products are added or updated while a user is browsing, they must not see duplicates or miss products.

To achieve this, I implemented snapshot-based browsing.

## How It Works

When the first page is requested:

```text
snapshot = current_timestamp
```

Every subsequent page request must include the same snapshot.

Queries only return records where:

```sql
updated_at <= snapshot
```

This effectively freezes the dataset for that browsing session.

Benefits:

* No duplicate products
* No missing products
* Consistent browsing experience
* Handles both inserts and updates during navigation

---

# API Endpoints

## Get Products

```http
GET /products
```

### Query Parameters

| Parameter | Description                           |
| --------- | ------------------------------------- |
| limit     | Number of products per page (max 100) |
| category  | Optional category filter              |
| cursor    | Cursor from previous page             |
| snapshot  | Snapshot timestamp                    |

### Example

```http
GET /products?limit=20&category=electronics
```

### Example Response

```json
{
  "snapshot": "2026-06-23T12:00:00Z",
  "nextCursor": "...",
  "hasNextPage": true,
  "count": 20,
  "products": []
}
```

---

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

# Running Locally

## Install Dependencies

```bash
npm install
```

## Configure Environment

Create `.env`

```env
DATABASE_URL=your_postgresql_connection_string
PORT=5000
```

## Start Development Server

```bash
npm run dev
```

## Seed Database

```bash
npm run seed
```

---

# Validation & Edge Cases

Handled cases:

* Invalid page size
* Maximum page size enforcement
* Optional category filtering
* Empty result sets
* End-of-pagination detection
* Invalid cursor protection
* Consistent pagination while data changes

---

# What I Would Improve With More Time

* Automated integration tests
* Query performance benchmarks
* OpenAPI / Swagger documentation
* Database migrations
* Rate limiting
* Signed cursors to prevent client-side cursor tampering

---

# AI Usage

AI was used as a development assistant for:

* Exploring pagination strategies
* Discussing database indexing
* Reviewing tradeoffs between offset and cursor pagination
* Reviewing implementation details

All implementation decisions, testing, and code understanding were verified manually.

---

# Key Takeaway

The primary goal of this solution was correctness under concurrent data changes while maintaining efficient pagination performance on a dataset of 200,000+ products.
