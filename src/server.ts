import express from "express";
import productsRouter from "./routes/products.route.js";
import path from "node:path";

const app = express();

app.use(express.json());

app.use(express.static(path.join(process.cwd(), "public")));
app.use("/products", productsRouter);

app.listen(5000, () => {
  console.log("Server running");
});
