// src/pemdas/_helpers/pemdas.helpers.ts
import { NODE_SIZE } from "../_constants/pemdas.constants";
import {
  BASE_LINE_WIDTH,
  EDGE_PADDING,
  SLOT_WIDTH,
} from "../_constants/pemdas.constants";
import { PemdasLayer, PemdasNode } from "../types";

export function computeLineWidth(nodeCount: number) {
  if (nodeCount === 0) return BASE_LINE_WIDTH;
  const contentWidth =
    nodeCount * NODE_SIZE + (nodeCount - 1) * SLOT_WIDTH + EDGE_PADDING * 2;
  return Math.max(BASE_LINE_WIDTH, contentWidth);
}

export function layoutNodes(
  nodes: Record<string, PemdasNode>,
  layer: PemdasLayer
) {
  const count = layer.nodeIds.length;
  if (count === 0) return;

  const usableWidth = layer.width - EDGE_PADDING * 2;

  const nodesWidth = count * NODE_SIZE + (count - 1) * SLOT_WIDTH;

  const startX = EDGE_PADDING + (usableWidth - nodesWidth) / 2 + NODE_SIZE / 2;

  layer.nodeIds.forEach((id, i) => {
    nodes[id] = {
      ...nodes[id],
      x: startX + i * (NODE_SIZE + SLOT_WIDTH),
      y: layer.y,
    };
  });
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
