// server/services/twilio/callState.js
import { broadcastToProject } from "../ws/broadcast.js";

let _wss = null;
const activeCalls = new Map(); // callSid -> { projectId, answeredBy, startedAt }

export function initCallState(wss) {
  _wss = wss;
  if (!_wss) console.warn("initCallState called with falsy wss");
}

export function setActiveCall(callSid, projectId, answeredBy = null) {
  console.log(projectId)
  activeCalls.set(callSid, { projectId, answeredBy, startedAt: Date.now() });
  if (!_wss) {
    console.warn(
      "setActiveCall: wss not initialized — active call registered but no broadcast"
    );
    return;
  }
  broadcastToProject(_wss, projectId, {
    type: "active_call",
    callSid,
    projectId,
    answeredBy,
  });
}

export function clearActiveCall(callSid) {
  const call = activeCalls.get(callSid);
  if (!call) return;
  if (_wss) {
    broadcastToProject(_wss, call.projectId, {
      type: "call_ended",
      callSid,
      projectId: call.projectId,
    });
  } else {
    console.warn("clearActiveCall: wss not initialized — can't broadcast call_ended");
  }
  activeCalls.delete(callSid);
}

export function getActiveCall(callSid) {
  return activeCalls.get(callSid) || null;
}