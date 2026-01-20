// server/handlers/modules/AI/AI_controllers.ts
import OpenAI from "openai";
import type { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const fetchAICompletion = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");

  const { prompt } = req.body;
  if (!prompt || !prompt.length) throw new Error("Missing required fields");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return {
    success: true,
    response: response.choices[0]?.message?.content ?? "",
  };
};
