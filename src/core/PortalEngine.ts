import { Point, Landmark, convexHull } from './MathUtils';

export class PortalEngine {
  static getPortalPolygon(landmarks: Landmark[][], width: number, height: number, isMirrored: boolean): Point[] | null {
    if (landmarks.length < 2) return null; // Wajib 2 tangan

    const points: Point[] = [];
    
    // Ambil titik-titik krusial dari KEDUA tangan (Wrist, Thumb tip, Index tip, Pinky tip)
    // Titik MediaPipe: 0 (Wrist), 4 (Thumb), 8 (Index), 20 (Pinky)
    const keyIndices = [0, 4, 8, 20];
    
    landmarks.forEach(hand => {
      keyIndices.forEach(idx => {
        const p = hand[idx];
        points.push({
          x: (isMirrored ? 1 - p.x : p.x) * width,
          y: p.y * height
        });
      });
    });

    // Buat karet pembungkus (Convex Hull) yang menutupi semua titik tangan
    return convexHull(points);
  }

  static detectPinch(landmarks: Landmark[][]): boolean {
    if (!landmarks || landmarks.length === 0) return false;
    
    for (let i = 0; i < landmarks.length; i++) {
      const hand = landmarks[i];
      const thumb = hand[4];
      const index = hand[8];
      // Hitung jarak 3D (x, y, z) untuk akurasi pinch
      const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y, thumb.z - index.z);
      if (distance < 0.05) return true; // Threshold pinch
    }
    return false;
  }
}