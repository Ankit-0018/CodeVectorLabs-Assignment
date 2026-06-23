import { Router } from "express";
import { productHandler } from "../controllers/product.controller.js";

const router = Router();

router.get("/", productHandler);

export default router;