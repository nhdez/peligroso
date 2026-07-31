export class VideoManager {
  private videoStream: MediaStream | null = null;
  public isVideoActive: boolean = false;

  async startCamera(): Promise<MediaStream | null> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: "user" },
        audio: false,
      });
      this.isVideoActive = true;
      return this.videoStream;
    } catch (err) {
      console.warn("Webcam access denied or unavailable:", err);
      this.isVideoActive = false;
      return null;
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    this.isVideoActive = false;
  }

  getStream(): MediaStream | null {
    return this.videoStream;
  }
}
