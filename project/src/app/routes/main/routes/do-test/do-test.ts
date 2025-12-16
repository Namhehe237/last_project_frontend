import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, AfterViewInit, ElementRef, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '#common/services/exam.service';
import { ExamSnapshot, ExamQuestionSnapshot } from '#common/models/ExamSnapshot';
import { AuthService } from '#common/services/auth.service';
import { NotificationService } from '#common/services/notification.service';
import { AntiCheatService } from '#common/services/anti-cheat.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-do-test',
  imports: [],
  templateUrl: './do-test.html',
  styleUrl: './do-test.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoTest implements OnInit, AfterViewInit, OnDestroy {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #examService = inject(ExamService);
  readonly #auth = inject(AuthService);
  readonly #notification = inject(NotificationService);
  readonly #antiCheat = inject(AntiCheatService);
  readonly #cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  examId: number | null = null;
  exam: ExamSnapshot | null = null;
  // questionId -> selected answerId
  selections = new Map<number, number>();

  // countdown in seconds
  remainingSeconds = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  isLoading = false;
  isSubmitting = false;
  
  // Anti-cheat
  sessionId = '';
  showCameraPreview = false;
  violationDetected = false;
  videoElement: HTMLVideoElement | null = null;
  readonly videoContainer = viewChild.required<ElementRef<HTMLDivElement>>('videoContainer');
  readonly cameraWrapper = viewChild.required<ElementRef<HTMLDivElement>>('cameraWrapper');
  
  // Drag and drop for camera
  cameraPosition = { x: 20, y: 20 };
  isDragging = false;
  dragOffset = { x: 0, y: 0 };

  // Video recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private videoStream: MediaStream | null = null;
  private isRecording = false;

  ngOnInit(): void {
    const examIdParam = this.#route.snapshot.paramMap.get('examId');
    this.examId = examIdParam ? Number(examIdParam) : null;
    if (!this.examId) {
      this.#notification.show('Invalid exam id', 'error');
      void this.#router.navigate(['/main/my-test']);
      return;
    }

    // Load saved camera position from localStorage
    this.loadCameraPosition();

    // Generate session ID
    this.sessionId = this.generateSessionId();

    // Setup violation listener
    this.setupViolationListener();

    // Start monitoring through backend service
    void this.initializeAntiCheat();
    
    this.fetchExamPaper(this.examId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.timerId) clearInterval(this.timerId);
    
    // Stop anti-cheat monitoring
    this.cleanupAntiCheat();
    
    // Cleanup drag event listeners
    this.cleanupDragListeners();
    
    // Save camera position to localStorage
    this.saveCameraPosition();
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async initializeAntiCheat(): Promise<void> {
    try {
      // Optional: set bearer token if available on auth service
      interface AuthServiceWithToken {
        getAccessToken?: () => string | null;
        accessToken?: string | null;
      }
      const authWithToken = this.#auth as AuthServiceWithToken;
      const token = authWithToken?.getAccessToken?.() ?? authWithToken?.accessToken ?? null;
      if (typeof token === 'string' && token) this.#antiCheat.setAuthToken(token);
      // Start anti-cheat session with examId and studentId
      const examId = this.examId;
      const studentId = this.#auth.userId;
      if (!examId || !studentId) {
        console.error('Missing examId or studentId for anti-cheat session');
        return;
      }
      const sid = await this.#antiCheat.startSession(examId, studentId);
      this.sessionId = sid;
      // Request media and start streaming
      const media = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      this.videoStream = media;
      
      // Start anti-cheat streaming
      await this.#antiCheat.startStreaming(media, { frameIntervalMs: 700, jpegQuality: 0.8 });
      this.#antiCheat.startAudioStreaming(media);
      
      // Start video recording
      this.startVideoRecording(media);
      
      // Preview element
      this.videoElement = this.#antiCheat.getVideoElement();
      this.showCameraPreview = this.videoElement !== null;
      if (this.videoElement) {
        setTimeout(() => {
          if (this.videoContainer()) {
            this.attachVideoElement();
          }
        }, 100);
      }
      // Subscribe alerts to show warnings
      this.#antiCheat.alerts$
        .pipe(takeUntil(this.destroy$))
        .subscribe(ev => {
          if (ev.alerts?.length) {
            this.#notification.show(`Anti-cheat: ${ev.alerts.join(', ')}`, 'info');
          }
        });
      this.#notification.show('Anti-cheat monitoring started', 'info');
      this.#cdr.markForCheck();
    } catch (error) {
      console.error('Error initializing anti-cheat:', error);
      this.#notification.show('Failed to start anti-cheat monitoring. Please allow camera access.', 'error');
      this.showCameraPreview = false;
      this.videoElement = null;
      // Continue with exam even if anti-cheat fails (for development)
      this.#cdr.markForCheck();
    }
  }

  private setupViolationListener(): void {
    this.#antiCheat.violation$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (violation) => {
          this.handleViolation(violation);
        },
        error: (error) => {
          console.error('Error in violation listener:', error);
        }
      });
  }

  private handleViolation(violation: { message?: string; violation_type?: string }): void {
    if (this.violationDetected || this.isSubmitting) {
      return; // Already handling violation
    }

    this.violationDetected = true;
    const violationMessage = violation.message ?? 'Cheating violation detected';
    this.#notification.show(violationMessage, 'error');

    // Force submit exam with 0 points
    const violationType = violation.violation_type ?? 'unknown';
    this.forceSubmitExam(violationType);
  }

  private forceSubmitExam(violationType: string): void {
    if (this.isSubmitting) return;

    const userId = this.#auth.userId;
    if (!userId || !this.examId) {
      this.#notification.show('Invalid session or exam', 'error');
      return;
    }

    this.isSubmitting = true;
    this.#examService.forceSubmitExam(this.examId, userId, violationType).subscribe({
      next: (grade) => {
        this.isSubmitting = false;
        this.#notification.show(`Exam submitted due to violation. Score: ${grade.score}/${grade.totalQuestions}`, 'error');
        void this.#router.navigate(['/main/test-history']);
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.#notification.show('Failed to submit exam', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  private attachVideoElement(): void {
    const container = this.videoContainer();
    if (this.videoElement && container) {
      // Style video element
      this.videoElement.style.width = '100%';
      this.videoElement.style.height = '100%';
      this.videoElement.style.objectFit = 'cover';
      
      // Clear container and append video
      container.nativeElement.innerHTML = '';
      container.nativeElement.appendChild(this.videoElement);
    }
  }

  ngAfterViewInit(): void {
    // Attach video element if it's already available
    if (this.videoElement && this.videoContainer()) {
      this.attachVideoElement();
    }
  }

  private cleanupAntiCheat(): void {
    // Stop video recording
    this.stopVideoRecording();
    
    // Stop streaming and session
    void this.#antiCheat.stopSession(this.sessionId).catch(error => {
      console.error('Error stopping anti-cheat monitoring:', error);
    });
    
    // Remove video element from DOM
    const container = this.videoContainer();
    if (container && this.videoElement) {
      try {
        container.nativeElement.removeChild(this.videoElement);
      } catch {
        // Element might already be removed
      }
    }
    
    // Stop all video tracks
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    
    this.videoElement = null;
    this.showCameraPreview = false;
  }

  private startVideoRecording(stream: MediaStream): void {
    try {
      this.recordedChunks = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        this.mediaRecorder = new MediaRecorder(stream, options);
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } else {
        this.mediaRecorder = new MediaRecorder(stream);
      }

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.uploadVideoToCloudinary(blob);
      };

      this.mediaRecorder.start(1000); // Collect data every 1 second
      this.isRecording = true;
      console.log('Video recording started');
    } catch (error) {
      console.error('Error starting video recording:', error);
      this.#notification.show('Failed to start video recording', 'error');
    }
  }

  private stopVideoRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
        this.isRecording = false;
        console.log('Video recording stopped');
      } catch (error) {
        console.error('Error stopping video recording:', error);
      }
    }
  }

  private uploadVideoToCloudinary(blob: Blob): void {
    if (!this.examId || !this.#auth.userId) {
      console.error('Cannot upload video: missing examId or userId');
      return;
    }

    if (!blob || blob.size === 0) {
      console.error('Cannot upload video: blob is empty');
      return;
    }

    console.log('Starting video upload - examId:', this.examId, 'userId:', this.#auth.userId, 'blobSize:', blob.size);

    this.#examService.uploadVideo(this.examId, this.#auth.userId, blob).subscribe({
      next: (videoUrl) => {
        console.log('Video uploaded successfully:', videoUrl);
        this.#notification.show('Video đã được lưu thành công!', 'success');
      },
      error: (error: unknown) => {
        console.error('Error uploading video:', error);
        const errorObj = error as { error?: string; message?: string };
        const errorMessage = errorObj?.error ?? errorObj?.message ?? 'Unknown error';
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.#notification.show(`Không thể upload video: ${errorMessage}`, 'error');
      }
    });
  }

  private fetchExamPaper(id: number): void {
    this.isLoading = true;
    this.#examService.getExamPaper(id).subscribe({
      next: (paper) => {
        this.exam = paper;
        const minutes = paper.durationMinutes ?? 0;
        this.remainingSeconds = Math.max(0, Math.floor(minutes * 60));
        this.startTimer();
        this.isLoading = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.#notification.show('Failed to load exam', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  private startTimer(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.#cdr.markForCheck();
        if (this.remainingSeconds === 0) {
          void this.onSubmit();
        }
      }
    }, 1000);
  }

  onSelect(questionId: number, answerId: number): void {
    this.selections.set(questionId, answerId);
  }

  get questions(): readonly ExamQuestionSnapshot[] {
    return this.exam?.questions ?? [];
  }

  fmtTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting || this.violationDetected) return;
    const userId = this.#auth.userId;
    if (!userId || !this.examId) {
      this.#notification.show('Invalid session or exam', 'error');
      return;
    }

    // Stop video recording and wait for upload
    this.stopVideoRecording();
    
    // Wait a bit for the recording to finish and upload
    if (this.recordedChunks.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Stop anti-cheat monitoring before submitting
    this.cleanupAntiCheat();

    // build answers
    const answers = this.questions.map(q => ({
      questionId: q.questionId!,
      answerId: (this.selections.get(q.questionId!) ?? -1)
    }));

    this.isSubmitting = true;
    this.#examService.gradeExam(this.examId, userId, answers).subscribe({
      next: (grade) => {
        this.isSubmitting = false;
        this.#notification.show(`Scored ${grade.score} (${grade.correctAnswers}/${grade.totalQuestions})`, 'success');
        void this.#router.navigate(['/main/test-history']);
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.#notification.show('Failed to submit exam', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  // Drag and drop handlers for camera
  onDragStart(event: MouseEvent): void {
    const wrapper = this.cameraWrapper();
    if (!wrapper) return;
    event.preventDefault();
    this.isDragging = true;
    
    const rect = wrapper.nativeElement.getBoundingClientRect();
    this.dragOffset.x = event.clientX - rect.left;
    this.dragOffset.y = event.clientY - rect.top;
    
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onDragEnd);
    this.#cdr.markForCheck();
  }

  onDrag = (event: MouseEvent): void => {
    if (!this.isDragging) return;
    
    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;
    
    // Keep camera within viewport bounds
    const maxX = window.innerWidth - 320; // camera width
    const maxY = window.innerHeight - 240; // camera height
    
    this.cameraPosition.x = Math.max(0, Math.min(newX, maxX));
    this.cameraPosition.y = Math.max(0, Math.min(newY, maxY));
    
    this.#cdr.markForCheck();
  };

  onDragEnd = (): void => {
    this.isDragging = false;
    this.cleanupDragListeners();
    this.saveCameraPosition();
    this.#cdr.markForCheck();
  };

  private cleanupDragListeners(): void {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.onDragEnd);
  }

  private saveCameraPosition(): void {
    try {
      localStorage.setItem('cameraPosition', JSON.stringify(this.cameraPosition));
    } catch {
      // Ignore localStorage errors
    }
  }

  private loadCameraPosition(): void {
    try {
      const saved = localStorage.getItem('cameraPosition');
      if (saved) {
        const pos = JSON.parse(saved) as { x?: number; y?: number } | null;
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
          this.cameraPosition = { x: pos.x, y: pos.y };
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}
