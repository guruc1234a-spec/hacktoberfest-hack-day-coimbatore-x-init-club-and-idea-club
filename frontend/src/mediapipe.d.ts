declare module '@mediapipe/face_mesh' {
  export interface Results {
    image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
    multiFaceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
    multiFaceGeometry?: any[];
  }

  export interface FaceMeshOptions {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    selfieMode?: boolean;
  }

  export class FaceMesh {
    constructor(config?: { locateFile?: (file: string) => string });
    setOptions(options: FaceMeshOptions): void;
    onResults(callback: (results: Results) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap }): Promise<void>;
    close(): Promise<void>;
  }
}

declare module '@mediapipe/camera_utils' {
  export interface CameraOptions {
    onFrame: () => Promise<void> | void;
    width?: number;
    height?: number;
    facingMode?: string;
  }

  export class Camera {
    constructor(videoElement: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): void;
  }
}
