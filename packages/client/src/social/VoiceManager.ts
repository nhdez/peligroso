export interface ParticipantVoiceState {
  id: string;
  name: string;
  role: "player" | "spectator";
  isMuted: boolean;
  isDeafened: boolean;
  speakingLevel: number; // 0 to 100
  canSpeak: boolean; // false by default for spectators
}

export class VoiceManager {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public isMicMuted: boolean = false;
  public isDeafened: boolean = false;
  public speakingLevel: number = 0;
  public onLevelUpdate?: (level: number) => void;

  async startMicrophone(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.monitorAudioLevel();
      return true;
    } catch (err) {
      console.warn("Microphone access denied or unavailable:", err);
      return false;
    }
  }

  private monitorAudioLevel = () => {
    if (!this.analyser || this.isMicMuted) {
      this.speakingLevel = 0;
      if (this.onLevelUpdate) this.onLevelUpdate(0);
      this.animFrameId = requestAnimationFrame(this.monitorAudioLevel);
      return;
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    this.speakingLevel = Math.min(100, Math.round((average / 128) * 100));

    if (this.onLevelUpdate) {
      this.onLevelUpdate(this.speakingLevel);
    }

    this.animFrameId = requestAnimationFrame(this.monitorAudioLevel);
  };

  toggleMic(): boolean {
    this.isMicMuted = !this.isMicMuted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMicMuted;
      });
    }
    if (this.isMicMuted) this.speakingLevel = 0;
    return this.isMicMuted;
  }

  toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    return this.isDeafened;
  }

  stop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
