// server/handlers/webhooks/schedule/schedule_routes.ts
import { Router } from "express";
import { runSubscriptionSchedule } from "../../modules/jobs/scheduling/setSubscriptionService.js";

const router = Router();

router.post("/run-subscription-schedule", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${process.env.INTERNAL_CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await runSubscriptionSchedule();
    return res.status(200).json({
      success: true,
      count: result.length,
    });
  } catch (err) {
    console.error("Internal schedule error:", err);
    return res.status(500).json({ error: "Schedule failed" });
  }
});

export default router;