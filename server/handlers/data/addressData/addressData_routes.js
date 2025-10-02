// server/handlers/data/addressData/addressData_routes.js
import express from "express";
import { authenticateUser } from "../../../connection/middlewares.js";
import {
  autoCompleteAddress,
  addressDetails
} from "./addressData_repositories.js";

const router = express.Router();

router.post("/autocomplete", authenticateUser, autoCompleteAddress);
router.post("/place-details", authenticateUser, addressDetails);

export default router;