export interface Point { x: number; y: number }
export interface Landmark { x: number; y: number; z: number }

// Monotone Chain Algorithm untuk membuat poligon (karet) yang membungkus semua titik
export function convexHull(points: Point[]): Point[] {
  if (points.length <= 3) return points;
  
  // Sort points by x, then y
  const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
  
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  
  const lower: Point[] = [];
  for (let i = 0; i < sorted.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) lower.pop();
    lower.push(sorted[i]);
  }
  
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) upper.pop();
    upper.push(sorted[i]);
  }
  
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Exponential Moving Average untuk menghaluskan gerakan tangan
export function smoothLandmarks(current: Landmark[][], previous: Landmark[][] | null, alpha: number = 0.5): Landmark[][] {
  if (!previous || previous.length !== current.length) return current;
  
  return current.map((hand, hIdx) => 
    hand.map((point, pIdx) => ({
      x: previous[hIdx][pIdx].x + alpha * (point.x - previous[hIdx][pIdx].x),
      y: previous[hIdx][pIdx].y + alpha * (point.y - previous[hIdx][pIdx].y),
      z: previous[hIdx][pIdx].z + alpha * (point.z - previous[hIdx][pIdx].z)
    }))
  );
}