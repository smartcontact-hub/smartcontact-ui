/**
 * Clamp a point inside the viewport so a popover/context-menu opened at
 * that position doesn't get clipped by the right or bottom edge.
 *
 * Estimated menu dimensions: 200×180 (matches the row-action menu used by
 * every list page). If a caller has a wildly different menu size it should
 * pass its own estimate, but for the common case the defaults are good.
 */
export function clampToViewport(
  x: number,
  y: number,
  estimatedWidth = 200,
  estimatedHeight = 180,
  edgePadding = 8,
): { readonly x: number; readonly y: number } {
  const maxX = Math.max(edgePadding, window.innerWidth - estimatedWidth - edgePadding);
  const maxY = Math.max(edgePadding, window.innerHeight - estimatedHeight - edgePadding);
  return {
    x: Math.min(x, maxX),
    y: Math.min(y, maxY),
  };
}
