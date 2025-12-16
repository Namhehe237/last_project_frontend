import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface ViolationEvent {
  type: string;
  violation_type: 'eye_gaze' | 'voice' | 'face_presence';
  timestamp: string;
  message: string;
  session_id: string;
}

export interface MonitoringResponse {
  status: string;
  session_id: string;
  message?: string;
}

interface SessionStartResponse {
  sessionId: string;
}

interface FrameResponse {
  alerts?: string[];
  metrics?: Record<string, unknown>;
  face?: Record<string, unknown>;
}

interface AudioResponse {
  alerts?: string[];
  metrics?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class AntiCheatService {
  private readonly antiCheatServiceUrl = 'http://localhost:8081';
  private violationSubject = new Subject<ViolationEvent>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private alertsSubject = new Subject<{ alerts: string[]; metrics?: Record<string, unknown>; face?: Record<string, unknown> }>();
  private frameStreamInterval: ReturnType<typeof setInterval> | null = null;
  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private bearerToken: string | null = null;
  private currentSessionId: string | null = null;
  private audioContext: AudioContext | null = null;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private isAudioStreaming = false;

  violation$ = this.violationSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  alerts$ = this.alertsSubject.asObservable();

  setAuthToken(token: string | null): void {
    this.bearerToken = token;
  }

  async startSession(examId: number, studentId: number): Promise<string> {
    const res = await fetch(`${this.antiCheatServiceUrl}/api/anti-cheat/session/start`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exam_id: examId,
        student_id: studentId
      })
    });
    if (!res.ok) {
      throw new Error(`startSession failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as SessionStartResponse;
    this.currentSessionId = data.sessionId;
    this.connectionStatusSubject.next(true);
    return data.sessionId;
  }

  async stopSession(sessionId?: string): Promise<void> {
    const sid = sessionId ?? this.currentSessionId;
    if (!sid) return;
    await fetch(`${this.antiCheatServiceUrl}/api/anti-cheat/session/stop?sessionId=${encodeURIComponent(sid)}`, {
      method: 'POST',
      headers: this.buildHeaders()
    });
    this.currentSessionId = null;
    this.connectionStatusSubject.next(false);
    this.stopStreaming();
  }

  async startStreaming(mediaStream: MediaStream, opts?: { frameIntervalMs?: number; jpegQuality?: number }): Promise<void> {
    const sid = this.currentSessionId;
    if (!sid) {
      throw new Error('Session not started');
    }
    const frameIntervalMs = opts?.frameIntervalMs ?? 700;
    const jpegQuality = opts?.jpegQuality ?? 0.8;

    this.videoStream = mediaStream;
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = mediaStream;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    await this.videoElement.play();

    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;

    if (this.frameStreamInterval) {
      clearInterval(this.frameStreamInterval);
      this.frameStreamInterval = null;
    }
    this.frameStreamInterval = setInterval(() => {
      this.captureAndPostFrame(jpegQuality);
    }, frameIntervalMs);
  }

  stopStreaming(): void {
    if (this.frameStreamInterval) {
      clearInterval(this.frameStreamInterval);
      this.frameStreamInterval = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.canvas = null;

    // Stop audio if running
    this.stopAudioStreaming();
  }

  private captureAndPostFrame(jpegQuality: number): void {
    if (!this.videoElement || !this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
    this.canvas.toBlob((blob) => {
      if (!blob) return;
      this.postFrame(blob).catch((err) => console.error('postFrame error', err));
    }, 'image/jpeg', jpegQuality);
  }

  private async postFrame(jpegBlob: Blob): Promise<void> {
    if (!this.currentSessionId) return;
    const form = new FormData();
    form.append('file', jpegBlob, 'frame.jpg');
    const headers: Record<string, string> = {
      ...this.buildHeaders(true),
      'X-Session-Id': this.currentSessionId
    };
    const res = await fetch(`${this.antiCheatServiceUrl}/api/anti-cheat/frame`, {
      method: 'POST',
      headers,
      body: form
    });
    if (!res.ok) {
      // Non-fatal; just log
      console.warn('frame post failed', res.status, res.statusText);
      return;
    }
    const data = await res.json() as FrameResponse;
    if (data?.alerts) {
      this.alertsSubject.next({ alerts: data.alerts, metrics: data.metrics, face: data.face });
    }
  }

  startAudioStreaming(stream: MediaStream): void {
    if (!this.currentSessionId || this.isAudioStreaming) return;
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    this.audioSource = this.audioContext.createMediaStreamSource(stream);
    // 4096 buffer, 1 channel
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.audioSource.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
    this.isAudioStreaming = true;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.audioProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.isAudioStreaming) return;
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const input = event.inputBuffer.getChannelData(0);
      // Resample from 48k (common) to 16k
      const targetRate = 16000;
      const srcRate = this.audioContext ? this.audioContext.sampleRate : 48000;
      const pcm16 = this.downsampleToPcm16(input, srcRate, targetRate);
      // Send small chunks ~400ms: accumulate if too small
      // 400ms at 16k mono = 6400 samples = 12800 bytes
      // We send whatever is produced per callback; browsers call ~85ms for 4096@48k
      this.postAudioChunk(pcm16).catch(err => console.warn('audio post failed', err));
    };
  }

  stopAudioStreaming(): void {
    this.isAudioStreaming = false;
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      this.audioProcessor.onaudioprocess = null;
      this.audioProcessor = null;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }

  private async postAudioChunk(pcm16Bytes: Uint8Array): Promise<void> {
    if (!this.currentSessionId) return;
    const form = new FormData();
    const ab = new ArrayBuffer(pcm16Bytes.byteLength);
    new Uint8Array(ab).set(pcm16Bytes);
    form.append('file', new Blob([ab], { type: 'application/octet-stream' }), 'audio.pcm');
    const headers: Record<string, string> = {
      ...this.buildHeaders(true),
      'X-Session-Id': this.currentSessionId
    };
    await fetch(`${this.antiCheatServiceUrl}/api/anti-cheat/audio`, {
      method: 'POST',
      headers,
      body: form
    }).then(async res => {
      if (!res.ok) return;
      const data = await res.json() as AudioResponse;
      if (data?.alerts) {
        this.alertsSubject.next({ alerts: data.alerts, metrics: data.metrics });
      }
    });
  }

  private downsampleToPcm16(input: Float32Array, srcSampleRate: number, targetSampleRate: number): Uint8Array {
    if (targetSampleRate === srcSampleRate) {
      return this.floatTo16BitPCM(input);
    }
    const sampleRateRatio = srcSampleRate / targetSampleRate;
    const newLength = Math.round(input.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
        const sample = input[i] ?? 0;
        accum += sample;
        count++;
      }
      result[offsetResult] = count > 0 ? (accum / count) : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return this.floatTo16BitPCM(result);
  }

  private floatTo16BitPCM(input: Float32Array): Uint8Array {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < input.length; i++, offset += 2) {
      const v = input[i] ?? 0;
      const s = Math.max(-1, Math.min(1, v));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Uint8Array(buffer);
  }
  private buildHeaders(skipJson = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!skipJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }
    return headers;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
}

