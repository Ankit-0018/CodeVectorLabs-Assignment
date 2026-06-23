import express from "express";
import productsRouter from "./routes/products.route.js";

const app = express();

app.use(express.json());

app.use("/products", productsRouter);

app.listen(5000, () => {
  console.log("Server running");
});