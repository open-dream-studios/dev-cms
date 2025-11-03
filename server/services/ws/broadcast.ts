// server/services/ws/broadcast.ts
export function broadcastToProject(wss: any, projectId: any, payload: any) {
  if (!wss) {
    console.warn("broadcastToProject called without wss");
    return;
  }
  if (typeof projectId === "undefined" || projectId === null) {
    console.warn("broadcastToProject called without projectId");
    return;
  }

  const numericProjectId = Number(projectId);
  if (Number.isNaN(numericProjectId)) {
    console.warn("broadcastToProject called with non-numeric projectId:", projectId);
    return;
  }

  const messageObj = { projectId: numericProjectId, ...payload };
  const message = JSON.stringify(messageObj);

  console.log("📡 Broadcast attempt:", messageObj, "totalClients:", wss.clients?.size ?? "unknown");

  let delivered = 0;
  let eligible = 0;

  wss.clients.forEach((client: any) => {
    try {
      const clientProj =
        typeof client.projectId !== "undefined" && client.projectId !== null
          ? Number(client.projectId)
          : null;

      // console.debug(`→ checking client id=${client.id ?? "?"} remote=${client._socket?.remoteAddress} proj=${clientProj} ready=${client.readyState}`);

      if (client.readyState !== 1) {
        return;
      }

      if (clientProj === null || Number.isNaN(clientProj)) {
        // client hasn't provided a projectId — don't send
        return;
      }

      eligible++;

      if (clientProj === numericProjectId) {
        client.send(message);
        delivered++;
        console.log(`✅ Broadcasted to client id=${client.id ?? "?"} (project ${clientProj})`);
      }
    } catch (err) {
      console.error("❌ Failed to broadcast to client:", err);
    }
  });

  console.log(`🔉 Broadcast summary: project=${numericProjectId} eligible=${eligible} delivered=${delivered}`);
}