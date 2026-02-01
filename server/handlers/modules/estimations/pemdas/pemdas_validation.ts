export const validatePemdasGraph = (cfg: any) => {
  if (!cfg) {
    throw new Error("Missing PEMDAS config");
  }

  // UI-serialized graph (what frontend actually sends)
  if (cfg.layers && cfg.nodes) {
    if (!Array.isArray(cfg.layers)) {
      throw new Error("Invalid PEMDAS layers");
    }
    if (typeof cfg.nodes !== "object") {
      throw new Error("Invalid PEMDAS nodes");
    }
    return;
  }

  throw new Error("Invalid PEMDAS graph config");
};