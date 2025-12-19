import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '#common/services/notification.service';

@Component({
  selector: 'app-pre-test',
  imports: [],
  templateUrl: './pre-test.html',
  styleUrl: './pre-test.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreTest implements OnInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #notification = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  examId: number | null = null;
  
  cameraPermission: 'pending' | 'granted' | 'denied' | 'error' = 'pending';
  microphonePermission: 'pending' | 'granted' | 'denied' | 'error' = 'pending';
  
  isTestingCamera = false;
  isTestingMicrophone = false;
  cameraStream: MediaStream | null = null;
  microphoneStream: MediaStream | null = null;
  
  readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  readonly audioElement = viewChild<ElementRef<HTMLAudioElement>>('audioElement');

  ngOnInit(): void {
    const examIdParam = this.#route.snapshot.paramMap.get('examId');
    this.examId = examIdParam ? Number(examIdParam) : null;
    if (!this.examId) {
      this.#notification.show('ID bài thi không hợp lệ', 'error');
      void this.#router.navigate(['/main/my-test']);
      return;
    }
    
    void this.checkPermissions();
  }

  ngOnDestroy(): void {
    this.stopCameraTest();
    this.stopMicrophoneTest();
  }

  async checkPermissions(): Promise<void> {
    try {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      this.cameraPermission = cameraStatus.state === 'granted' ? 'granted' : 
                              cameraStatus.state === 'denied' ? 'denied' : 'pending';
      
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      this.microphonePermission = micStatus.state === 'granted' ? 'granted' : 
                                  micStatus.state === 'denied' ? 'denied' : 'pending';
      
      this.#cdr.markForCheck();
    } catch (error) {
      console.warn('Permissions API not supported:', error);
      this.cameraPermission = 'pending';
      this.microphonePermission = 'pending';
      this.#cdr.markForCheck();
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      this.cameraPermission = 'granted';
      this.microphonePermission = 'granted';
      
      stream.getTracks().forEach(track => track.stop());
      
      this.#notification.show('Đã cấp quyền truy cập camera và microphone', 'success');
      this.#cdr.markForCheck();
    } catch (error) {
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.cameraPermission = 'denied';
        this.microphonePermission = 'denied';
        this.#notification.show('Bạn cần cấp quyền truy cập camera và microphone để làm bài thi', 'error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.cameraPermission = 'error';
        this.microphonePermission = 'error';
        this.#notification.show('Không tìm thấy camera hoặc microphone', 'error');
      } else {
        this.cameraPermission = 'error';
        this.microphonePermission = 'error';
        this.#notification.show('Lỗi khi yêu cầu quyền truy cập', 'error');
      }
      this.#cdr.markForCheck();
    }
  }

  async testCamera(): Promise<void> {
    if (this.isTestingCamera) {
      this.stopCameraTest();
      return;
    }

    try {
      this.isTestingCamera = true;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      });
      
      this.cameraStream = stream;
      this.cameraPermission = 'granted';
      
      const videoEl = this.videoElement();
      if (videoEl) {
        videoEl.nativeElement.srcObject = stream;
        await videoEl.nativeElement.play();
      }
      
      this.#cdr.markForCheck();
    } catch (error) {
      this.isTestingCamera = false;
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.cameraPermission = 'denied';
        this.#notification.show('Quyền truy cập camera bị từ chối', 'error');
      } else {
        this.cameraPermission = 'error';
        this.#notification.show('Không thể truy cập camera', 'error');
      }
      this.#cdr.markForCheck();
    }
  }

  stopCameraTest(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    
    const videoEl = this.videoElement();
    if (videoEl) {
      videoEl.nativeElement.srcObject = null;
    }
    
    this.isTestingCamera = false;
    this.#cdr.markForCheck();
  }

  async testMicrophone(): Promise<void> {
    if (this.isTestingMicrophone) {
      this.stopMicrophoneTest();
      return;
    }

    try {
      this.isTestingMicrophone = true;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true 
      });
      
      this.microphoneStream = stream;
      this.microphonePermission = 'granted';
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudio = () => {
        if (!this.isTestingMicrophone) return;
        analyser.getByteFrequencyData(dataArray);
        requestAnimationFrame(checkAudio);
      };
      checkAudio();
      
      this.#cdr.markForCheck();
    } catch (error) {
      this.isTestingMicrophone = false;
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.microphonePermission = 'denied';
        this.#notification.show('Quyền truy cập microphone bị từ chối', 'error');
      } else {
        this.microphonePermission = 'error';
        this.#notification.show('Không thể truy cập microphone', 'error');
      }
      this.#cdr.markForCheck();
    }
  }

  stopMicrophoneTest(): void {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    
    this.isTestingMicrophone = false;
    this.#cdr.markForCheck();
  }

  canProceed(): boolean {
    return this.cameraPermission === 'granted' && this.microphonePermission === 'granted';
  }

  onProceed(): void {
    if (!this.canProceed()) {
      this.#notification.show('Vui lòng cấp quyền truy cập camera và microphone trước khi tiếp tục', 'error');
      return;
    }

    if (!this.examId) {
      this.#notification.show('ID bài thi không hợp lệ', 'error');
      return;
    }

    this.stopCameraTest();
    this.stopMicrophoneTest();

    void this.#router.navigate(['/main/do-test', this.examId]);
  }

  onCancel(): void {
    this.stopCameraTest();
    this.stopMicrophoneTest();
    void this.#router.navigate(['/main/my-test']);
  }

  getPermissionStatusText(permission: 'pending' | 'granted' | 'denied' | 'error'): string {
    switch (permission) {
      case 'granted':
        return 'Đã cấp quyền';
      case 'denied':
        return 'Bị từ chối';
      case 'error':
        return 'Lỗi';
      default:
        return 'Chưa cấp quyền';
    }
  }

  getPermissionStatusClass(permission: 'pending' | 'granted' | 'denied' | 'error'): string {
    switch (permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  }
}
