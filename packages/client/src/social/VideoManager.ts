export class VideoManager {
  private videoStream: MediaStream | null = null;
  public isVideoActive: boolean = false;
  private streamListeners: ((stream: MediaStream | null) => void)[] = [];

  constructor(public matchID: string = "demo-match", public userID: string = "0") {}

  onStreamChange(cb: (stream: MediaStream | null) => void) {
    this.streamListeners.push(cb);
  }

  async startCamera(): Promise<MediaStream | null> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: "user" },
        audio: false,
      });
      this.isVideoActive = true;
      this.streamListeners.forEach((cb) => cb(this.videoStream));
      return this.videoStream;
    } catch (err) {
      console.warn("Webcam access denied or unavailable:", err);
      this.isVideoActive = false;
      this.streamListeners.forEach((cb) => cb(null));
      return null;
    }
  }

  async startLocalStream(): Promise<boolean> {
    const stream = await this.startCamera();
    return stream !== null;
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    this.isVideoActive = false;
    this.streamListeners.forEach((cb) => cb(null));
  }

  stopLocalStream() {
    this.stopCamera();
  }

  getStream(): MediaStream | null {
    return this.videoStream;
  }
}
