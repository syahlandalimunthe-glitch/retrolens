import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class HandTracker {
  private static instance: HandLandmarker | null = null;
  private static initPromise: Promise<HandLandmarker> | null = null;

  static async getInstance(): Promise<HandLandmarker> {
    if (this.instance) return this.instance;
    
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            // Model resmi langsung dari Google Storage (Aman, cepat, dan tidak memberatkan repo)
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.instance = landmarker;
        return landmarker;
      })();
    }
    
    return this.initPromise;
  }
}