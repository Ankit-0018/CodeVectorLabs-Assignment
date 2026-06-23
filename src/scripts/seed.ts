import { pool } from "../config/db.js";

async function seed() {
  console.time("seed");

  await pool.query(`
    INSERT INTO products (
      name,
      category,
      price,
      created_at,
      updated_at
    )
    SELECT
      'Product ' || gs,
      (
        ARRAY[
          'electronics',
          'books',
          'clothing',
          'sports',
          'home'
        ]
      )[floor(random() * 5 + 1)],
      round((random() * 10000)::numeric, 2),
      NOW() - (random() * interval '365 days'),
      NOW() - (random() * interval '365 days')
    FROM generate_series(1, 200000) gs;
  `);

  console.timeEnd("seed");

  const result = await pool.query("SELECT COUNT(*) FROM products");

  console.log(`Total products: ${result.rows[0].count}`);

  await pool.end();
}

seed()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
