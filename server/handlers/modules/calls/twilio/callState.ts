// server/handlers/modules/calls/twilio/callState.js
import { broadcastToProject } from "../../../../services/ws/broadcast.js";

let _wss: any = null;
const activeCalls = new Map(); // callSid -> { projectId, answeredBy, startedAt }

export function initCallState(wss: any) {
  _wss = wss;
  if (!_wss) console.warn("initCallState called with falsy wss");
}

export function setActiveCall(callSid: any, projectId: any, answeredBy = null) {
  console.log(projectId);
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

export function clearActiveCall(callSid: any) {
  const call = activeCalls.get(callSid);
  if (!call) return;
  if (_wss) {
    broadcastToProject(_wss, call.projectId, {
      type: "call_ended",
      callSid,
      projectId: call.projectId,
    });
  } else {
    console.warn(
      "clearActiveCall: wss not initialized — can't broadcast call_ended"
    );
  }
  activeCalls.delete(callSid);
}

export function getActiveCall(callSid: any) {
  return activeCalls.get(callSid) || null;
}
