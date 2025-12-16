import { ChangeDetectionStrategy, Component, input, output, inject, ChangeDetectorRef, OnInit, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors  } from '@angular/forms';
import { ExamService } from '#common/services/exam.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { DrawerComponent } from '#common/components/drawer/drawer';
import { ClassService } from '#common/services/class.service';
import { ClassOption } from '#common/models/ClassOption';
import { RandomExamResponse } from '#common/models/RandomExamResponse';
import { Observable } from 'rxjs';

export enum ExamStatus {
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED'
}

@Component({
  selector: 'app-add-exam-detail-drawer',
  imports: [ReactiveFormsModule, DrawerComponent],
  templateUrl: './add-exam-detail-drawer.html',
  styleUrl: './add-exam-detail-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddExamDetailDrawer implements OnInit {
  readonly isOpen = input.required<boolean>();
  readonly selectedQuestionIds = input.required<number[]>();

  readonly created = output<boolean>();
  readonly closeDrawer = output<void>();
  readonly randomExamReady = output<RandomExamResponse>();

  readonly #examService = inject(ExamService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #fb = inject(FormBuilder);
  readonly #classService = inject(ClassService);


  form: FormGroup;
  isLoading = false;
  classOptions: ClassOption[] = [];
  isClassOptionsLoading = false;
  creationMode: 'manual' | 'random' = 'manual';
  #wasOpen = false;

  constructor() {
    this.form = this.#fb.group({
      examName: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      subjectName: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      durationMinutes: [60, [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      maxAttempts: [1, [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      className: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      startTime: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      endTime: ['', [
        (control: AbstractControl): ValidationErrors | null => Validators.required(control),
        this.endTimeValidator.bind(this)
      ]],
      totalQuestions: [0, [Validators.min(0)]],
      easyQuestionCount: [0, [Validators.min(0)]],
      mediumQuestionCount: [0, [Validators.min(0)]],
      hardQuestionCount: [0, [Validators.min(0)]]
    });

    effect(() => {
      const nowOpen = this.isOpen();
      if (nowOpen && !this.#wasOpen) {
        this.creationMode = this.hasSelectedQuestions ? 'manual' : 'random';
        this.#cdr.markForCheck();
      }
      this.#wasOpen = nowOpen;
    });
  }

  private endTimeValidator(control: AbstractControl): ValidationErrors | null {
    const endTime = control.value as string | null;
    const startTime = this.form?.get('startTime')?.value as string | null;
    
    if (!endTime || !startTime) {
      return null;
    }
    
    if (new Date(endTime) <= new Date(startTime)) {
      return { endTimeBeforeStart: true };
    }
    
    return null;
  }

  ngOnInit(): void {
    const teacherId = this.#auth.userId;
    if (teacherId) {
      this.loadClassOptions(teacherId);
    }

    this.form.get('startTime')?.valueChanges.subscribe(() => {
      this.form.get('endTime')?.updateValueAndValidity();
    });
  }

  private loadClassOptions(teacherId: number) {
    this.isClassOptionsLoading = true;
    this.#classService.getClassOptions(teacherId).subscribe({
      next: (options) => {
        this.classOptions = options ?? [];
        this.isClassOptionsLoading = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isClassOptionsLoading = false;
        this.#notificationService.show('Không thể tải danh sách lớp học', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  setCreationMode(mode: 'manual' | 'random') {
    if (mode === 'manual' && !this.hasSelectedQuestions) {
      this.creationMode = 'random';
      this.#cdr.markForCheck();
      return;
    }
    this.creationMode = mode;
    this.#cdr.markForCheck();
  }

  onCreate() {
    if (this.form.invalid) return;

    const teacherId = this.#auth.userId;
    if (!teacherId) {
      this.#notificationService.show('Bạn chưa được xác thực', 'error');
      return;
    }
    
    this.isLoading = true;

    const examName = String(this.form.get('examName')?.value ?? '');
    const subjectName = String(this.form.get('subjectName')?.value ?? '');
    const durationMinutes = Number(this.form.get('durationMinutes')?.value ?? 0);
    const maxAttempts = Number(this.form.get('maxAttempts')?.value ?? 0);
    const className = String(this.form.get('className')?.value ?? '');
    const startTime = String(this.form.get('startTime')?.value ?? '');
    const endTime = String(this.form.get('endTime')?.value ?? '');
    
    const startTimeDate = new Date(startTime);
    const currentTime = new Date();
    const examStatus = startTimeDate <= currentTime ? ExamStatus.PUBLISHED : ExamStatus.CLOSED;

    let request$: Observable<string | RandomExamResponse>;
    const isRandomMode = this.creationMode === 'random';

    if (!isRandomMode) {
      const selectedIds = this.selectedQuestionIds() ?? [];
      if (!selectedIds.length) {
        this.#notificationService.show('Vui lòng chọn ít nhất một câu hỏi trước khi tạo đề thi.', 'info');
        this.isLoading = false;
        this.#cdr.markForCheck();
        return;
      }
      request$ = this.#examService.createExam(
        examName,
        subjectName,
        durationMinutes,
        maxAttempts,
        className,
        selectedIds,
        startTime,
        endTime,
        examStatus,
        String(teacherId)
      );
    } else {
      const validationMessage = this.randomValidationMessage;
      if (validationMessage) {
        this.#notificationService.show(validationMessage, 'info');
        this.isLoading = false;
        this.#cdr.markForCheck();
        return;
      }
      const easyCount = this.getNumberControlValue('easyQuestionCount');
      const mediumCount = this.getNumberControlValue('mediumQuestionCount');
      const hardCount = this.getNumberControlValue('hardQuestionCount');
      request$ = this.#examService.createRandomExam(
        examName,
        subjectName,
        durationMinutes,
        maxAttempts,
        className,
        startTime,
        endTime,
        examStatus,
        String(teacherId),
        easyCount,
        mediumCount,
        hardCount
      );
    }

    request$.subscribe({
      next: (response) => {
        this.isLoading = false;
        if (isRandomMode && response && typeof response === 'object' && 'examId' in response) {
          this.randomExamReady.emit(response);
          this.closeDrawer.emit();
        } else {
          this.#notificationService.show('Tạo đề thi thành công!', 'success');
          this.created.emit(true);
          this.closeDrawer.emit();
        }
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.#notificationService.show('Tạo đề thi thất bại!', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  onClose() {
    this.closeDrawer.emit();
  }

  get randomValidationMessage(): string | null {
    if (this.creationMode !== 'random') return null;

    const total = this.getNumberControlValue('totalQuestions');
    const easy = this.getNumberControlValue('easyQuestionCount');
    const medium = this.getNumberControlValue('mediumQuestionCount');
    const hard = this.getNumberControlValue('hardQuestionCount');

    if (total <= 0) return 'Tổng số câu hỏi phải lớn hơn 0.';
    if (easy < 0 || medium < 0 || hard < 0) return 'Số lượng câu hỏi không được âm.';
    if (easy + medium + hard !== total) return 'Dễ + Trung bình + Khó phải bằng Tổng số câu hỏi.';

    return null;
  }

  get hasSelectedQuestions(): boolean {
    return (this.selectedQuestionIds()?.length ?? 0) > 0;
  }

  isCreateDisabled(): boolean {
    if (this.isLoading || this.form.invalid) return true;
    if (this.creationMode === 'random') {
      return !!this.randomValidationMessage;
    }
    if (this.creationMode === 'manual' && !this.hasSelectedQuestions) {
      return true;
    }
    return false;
  }

  private getNumberControlValue(controlName: string): number {
    return Number(this.form.get(controlName)?.value ?? 0);
  }
}
