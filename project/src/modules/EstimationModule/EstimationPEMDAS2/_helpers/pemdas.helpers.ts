// src/pemdas/_helpers/pemdas.helpers.ts
import { NODE_SIZE } from "../_constants/pemdas.constants";
import {
  BASE_LINE_WIDTH,
  EDGE_PADDING, 
  MIN_NODE_GAP,
} from "../_constants/pemdas.constants";
import { PemdasLayer, PemdasNode } from "../types";
 
export function getSlotCenters(lineWidth: number, count: number): number[] {
  if (count <= 0) return []; 
  if (count === 1) return [lineWidth / 2];

  const start = EDGE_PADDING + NODE_SIZE / 2;
  const step = NODE_SIZE + MIN_NODE_GAP;

  // NOTE: lineWidth may be larger than required; we still use fixed step
  // and center the whole pack on the line by shifting.
  const packWidth = (count - 1) * step;
  const minStart = start;
  const maxStart = lineWidth - EDGE_PADDING - NODE_SIZE / 2 - packWidth;

  // If line is wider than required, center the pack
  const centeredStart = (minStart + maxStart) / 2;
  const actualStart = Math.max(minStart, Math.min(maxStart, centeredStart));

  return Array.from({ length: count }, (_, i) => actualStart + i * step);
}

/**
 * Layout nodes exactly on slots based on layer.nodeIds order.
 */
export function layoutNodes(nodes: Record<string, PemdasNode>, layer: PemdasLayer) {
  const ids = layer.nodeIds;
  const centers = getSlotCenters(layer.width, ids.length);

  ids.forEach((id, i) => {
    const n = nodes[id];
    if (!n) return;
    nodes[id] = {
      ...n,
      x: centers[i],
      y: layer.y,
    };
  });
}

/**
 * Given an X (layer-local), return the closest slot index.
 */
export function getClosestSlotIndex(x: number, lineWidth: number, count: number) {
  const centers = getSlotCenters(lineWidth, count);
  if (centers.length === 0) return 0;

  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(x - centers[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }

  return best;
}

/**
 * Utility to reorder an array by moving item at from -> to.
 */
export function arrayMove<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}





// PREVIOUS
export function computeLineWidth(count: number) {
  if (count <= 0) return BASE_LINE_WIDTH;
  const required =
    EDGE_PADDING * 2 +
    count * NODE_SIZE +
    Math.max(0, count - 1) * MIN_NODE_GAP;
  return Math.max(BASE_LINE_WIDTH, required);
}

export function getScrollXWidth(bounds: any, viewportWidth: number) {
  const panRange = bounds.maxPanX - bounds.minPanX;
  if (panRange <= 0) {
    return viewportWidth;
  }
  return Math.max(
    8,
    (viewportWidth / (viewportWidth + panRange)) * viewportWidth
  );
}

export function getScrollXLeft(
  panX: number,
  bounds: any,
  viewportWidth: number
) {
  const panRange = bounds.maxPanX - bounds.minPanX;
  if (panRange <= 0) return 0;
  const track = viewportWidth;
  const thumb = getScrollXWidth(bounds, viewportWidth);
  const t = (panX - bounds.minPanX) / panRange;
  const clamped = Math.min(1, Math.max(0, t));
  return (1 - clamped) * (track - thumb);
}

export function getScrollYHeight(bounds: any, viewportHeight: number) {
  const panRange = bounds.maxPanY - bounds.minPanY;
  if (panRange <= 0) {
    return viewportHeight;
  }
  return Math.max(
    8,
    (viewportHeight / (viewportHeight + panRange)) * viewportHeight
  );
}

export function getScrollYTop(
  panY: number,
  bounds: any,
  viewportHeight: number
) {
  const panRange = bounds.maxPanY - bounds.minPanY;
  if (panRange <= 0) return 0;
  const track = viewportHeight;
  const thumb = getScrollYHeight(bounds, viewportHeight);
  const t = (panY - bounds.minPanY) / panRange;
  const clamped = Math.min(1, Math.max(0, t));
  return (1 - clamped) * (track - thumb);
}
