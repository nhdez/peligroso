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

  private peerAudioElements: Map<string, HTMLAudioElement> = new Map();
  private spectatorMuteMap: Map<string, boolean> = new Map();
  public muteAllSpectators: boolean = true;

  public isMicMuted: boolean = false;
  public isDeafened: boolean = false;
  public speakingLevel: number = 0;
  public onLevelUpdate?: (level: number) => void;

  constructor(public matchID: string = "demo-match", public userID: string = "0") {}

  // Mute or unmute specific spectator audio output for this player
  setSpectatorMuted(spectatorId: string, isMuted: boolean) {
    this.spectatorMuteMap.set(spectatorId, isMuted);
    const audioEl = this.peerAudioElements.get(spectatorId);
    if (audioEl) {
      audioEl.muted = isMuted || this.muteAllSpectators;
    }
  }

  // Toggle master mute for all spectators
  setMuteAllSpectators(muteAll: boolean) {
    this.muteAllSpectators = muteAll;
    this.peerAudioElements.forEach((audioEl, id) => {
      if (id.startsWith("spec-") || id.includes("spectator")) {
        audioEl.muted = muteAll || (this.spectatorMuteMap.get(id) ?? true);
      }
    });
  }

  // Register remote audio track for a peer (Player or Spectator)
  registerPeerAudioTrack(peerId: string, track: MediaStreamTrack, role: "player" | "spectator") {
    const stream = new MediaStream([track]);
    let audioEl = this.peerAudioElements.get(peerId);
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      this.peerAudioElements.set(peerId, audioEl);
    }
    audioEl.srcObject = stream;

    if (role === "spectator") {
      const isMuted = this.muteAllSpectators || (this.spectatorMuteMap.get(peerId) ?? true);
      audioEl.muted = isMuted;
    }
  }

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
    this.peerAudioElements.forEach((el) => {
      el.muted = this.isDeafened;
    });
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
    this.peerAudioElements.forEach((el) => el.remove());
    this.peerAudioElements.clear();
  }
}
