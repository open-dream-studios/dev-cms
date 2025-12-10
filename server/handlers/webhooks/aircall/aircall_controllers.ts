// server/handlers/webhooks/aircall/aircall_controllers.ts
import { Request, Response } from "express";
import { AircallWebhookRequest, AircallCallData } from "./aircall_types.js";
import path from "path";
import fs from "fs";
import { getCallDetails, downloadRecordingFile } from "./aircall_api.js";
import { buildS3Key, uploadFileToS3 } from "../../../services/aws/S3.js";
import { getDecryptedIntegrationsFunction } from "../../../handlers/integrations/integrations_repositories.js";
import { cleanPhone } from "../../../functions/data.js";
import { transcribeAudio } from "../../../services/transcription/scribe.js";
import { deleteLocalFile } from "../../../util/files.js";
import { upsertCallFunction } from "../../../handlers/modules/calls/calls_repositories.js";
import type { PoolConnection } from "mysql2/promise";
import { getProjectsFunction } from "../../../handlers/projects/projects_repositories.js";
import { Project } from "@open-dream/shared";

const processedCalls = new Set<number>();

export const handleAircallWebhook = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  try {
    const body = req.body as AircallWebhookRequest;

    if (!body || !body.event || !body.data) {
      console.error("❌ Invalid webhook payload");
      return { success: false, error: "Invalid payload", status: 400 };
    }

    // console.log("\n============================");
    // console.log("📞 AIRCALL WEBHOOK RECEIVED");
    // console.log("============================");
    // console.log("Event:", body.event);
    // console.log("Webhook ID:", body.id);
    // console.log("Timestamp:", new Date(body.timestamp * 1000).toISOString());

    switch (body.event) {
      case "call.created":
        await onCallCreated(body.data);
        break;

      case "call.answered":
        await onCallAnswered(body.data);
        break;

      case "call.hungup":
        await onCallHungup(body.data);
        break;

      case "call.ended":
        await onCallEnded(body.data);
        break;

      case "call.comm_assets_generated":
        await onRecordingReady(connection, body.data);
        break;

      default:
        console.log("⚠️ Unhandled event type:", body.event);
    }

    return { success: true, status: 200 };
  } catch (err) {
    console.error("🔥 Aircall webhook error:", err);
    return { success: false, error: "Aircall webhook error", status: 500 };
  }
};

// ------------------------------------------------------
// EVENT HANDLERS
// ------------------------------------------------------

async function onCallCreated(data: AircallCallData) {
  // console.log("\n📞 CALL CREATED");
  // logCallMeta(data);
}

async function onCallAnswered(data: AircallCallData) {
  // console.log("\n📞 CALL ANSWERED");
  // logCallMeta(data);
}

async function onCallHungup(data: AircallCallData) {
  // console.log("\n📞 CALL HUNG UP");
  // logCallMeta(data);
}

async function onCallEnded(data: AircallCallData) {
  const callId = data.id;
  if (processedCalls.has(callId)) {
    console.log(`⚠️ Already processed call ${callId}, skipping`);
    return;
  }
  processedCalls.add(callId);
  // console.log("\n📞 CALL ENDED (processing once)");
  // logCallMeta(data);
}

async function onRecordingReady(connection: PoolConnection, data: any) {
  // console.log("\n🎧 RECORDING ASSET GENERATED");
  // console.log("RAW RECORDING EVENT DATA:", JSON.stringify(data, null, 2));

  // console.log("From:", data.raw_digits);
  // console.log("To (Aircall number):", data.number?.digits);

  if (
    !data.raw_digits ||
    cleanPhone(data.raw_digits).length !== 10 ||
    !data.number ||
    !data.number.digits ||
    cleanPhone(data.number.digits).length !== 10
  ) {
    return;
  }

  const toNumber = cleanPhone(data.number.digits);
  const fromNumber = cleanPhone(data.raw_digits);

  if (!data.direction) return;
  const searchNumber = data.direction === "inbound" ? toNumber : fromNumber;

  const projects = await getProjectsFunction();

  const project = projects.find((project: Project) => {
    if (!project.numbers) return false;
    let numbersArray: string[] | number[] = [];
    if (Array.isArray(project.numbers)) {
      numbersArray = project.numbers;
    } else {
      try {
        numbersArray = JSON.parse(project.numbers as any);
      } catch (err) {
        console.warn(
          `⚠️ Failed to parse numbers for project ${project.project_id}`
        );
        return false;
      }
    }
    return numbersArray.map(String).includes(searchNumber);
  });

  if (!project || !project.id || !project.project_id) return;
  const project_idx = project.id;
  const projectId = project.project_id;
  const url = data.recording;

  if (!url) {
    console.log("⚠️ No recording URL provided in webhook payload");
    return;
  }

  try {
    const audioBuffer = await downloadRecordingFile(url);

    const filePath = path.resolve(
      `./handlers/webhooks/aircall/recordings/${data.id}.mp3`
    );

    fs.writeFileSync(filePath, audioBuffer);
    // console.log("✅ Recording downloaded:", filePath);

    // HERE I COPIED LOGIC OVER
    const requiredKeys = [
      "AWS_REGION",
      "AWS_S3_MEDIA_BUCKET",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ];
    const decryptedKeys = await getDecryptedIntegrationsFunction(
      project_idx,
      requiredKeys,
      []
    );
    if (!decryptedKeys)
      return { success: false, message: "Required keys not found" };

    const finalMeta = {
      ext: "mp3",
      mimeType: "audio/mpeg",
    };

    const s3Key = buildS3Key({
      projectId,
      ext: finalMeta.ext,
      type: "recordings",
    });

    // Upload
    const uploadResult = await uploadFileToS3(
      {
        filePath: filePath,
        key: s3Key,
        contentType: finalMeta.mimeType,
      },
      decryptedKeys
    );
    // console.log(uploadResult);
    const transcription = await transcribeAudio(filePath);
    await deleteLocalFile(filePath);
    // console.log(result.segments);

    // console.log(toNumber, fromNumber, project_idx, transcription);
    // console.log("DONE");

    const callInput = {
      project_idx,
      call_id: null,
      aircall_call_id: data.id,
      call_uuid: data.call_uuid || null,
      direction: data.direction || "inbound",
      from_number: fromNumber,
      to_number: toNumber,
      started_at: data.started_at ? new Date(data.started_at * 1000) : null,
      ended_at: data.ended_at ? new Date(data.ended_at * 1000) : null,
      duration: data.duration || null,
      status: data.status || "done",
      agent_id: data.user?.id || null,
      agent_name: data.user?.name || null,
      agent_email: data.user?.email || null,
      hangup_cause: data.hangup_cause || null,
      recording_url: uploadResult?.Location || null,
      transcription: transcription || null,
      aircall_direct_link: data.direct_link || null,
    };

    // console.log(
    //   "Prepared call input for upsert:",
    //   JSON.stringify(callInput, null, 2)
    // );

    await upsertCallFunction(connection, callInput);
  } catch (err) {
    console.error("🔥 Error downloading recording:", err);
  }
}

function logCallMeta(data: AircallCallData) {
  console.log("Call ID:", data.id);
  console.log("Direction:", data.direction);
  console.log("Status:", data.status);
  console.log("From:", data.raw_digits);
  console.log("To (Aircall number):", data.number?.digits);

  if (data.user) {
    console.log("Handled by agent:", data.user.name, `<${data.user.email}>`);
  } else {
    console.log("Handled by agent: none");
  }

  if (data.answered_at) {
    console.log(
      "Answered at:",
      new Date(data.answered_at * 1000).toISOString()
    );
  }
  if (data.ended_at) {
    console.log("Ended at:", new Date(data.ended_at * 1000).toISOString());
  }

  console.log("Direct link:", data.direct_link);
}
