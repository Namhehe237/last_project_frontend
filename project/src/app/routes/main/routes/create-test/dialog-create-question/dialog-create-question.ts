import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionService } from '#common/services/question.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY'
}

@Component({
  selector: 'app-dialog-create-question',
  imports: [ReactiveFormsModule],
  templateUrl: './dialog-create-question.html',
  styleUrl: './dialog-create-question.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogCreateQuestion {
  readonly #questionService = inject(QuestionService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);

  readonly compRef = input.required<ComponentRef<DialogCreateQuestion>>();

  readonly closed = output<string | undefined>();
  readonly createQuestionResult = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_create_question');

  readonly DifficultyLevel = DifficultyLevel;
  readonly QuestionType = QuestionType;

  readonly form = new FormGroup({
    questionText: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] }),
    questionType: new FormControl<QuestionType | ''>('', { nonNullable: false, validators: [c => Validators.required(c)] }),
    difficultyLevel: new FormControl<DifficultyLevel | ''>('', { nonNullable: false, validators: [c => Validators.required(c)] }),
    subjectName: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] }),
    answer1: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] }),
    answer2: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] }),
    answer3: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] }),
    answer4: new FormControl<string>('', { nonNullable: true, validators: [c => Validators.required(c)] })
  });

  protected readonly status = signal<0 | 1>(0);
  protected readonly uploadStatus = signal<0 | 1>(0);
  protected readonly selectedExcelFile = signal<File | null>(null);
  protected selectedExcelFileName = '';
  protected readonly canSubmit = signal<boolean>(false);

  private checkCanSubmit(): void {
    if (this.selectedExcelFile()) {
      this.canSubmit.set(true);
      return;
    }
    const difficultyLevel = this.form.controls.difficultyLevel.value;
    const isValid = this.form.controls.questionText.value.trim() !== '' &&
           difficultyLevel !== null && difficultyLevel !== '' &&
           this.form.controls.subjectName.value.trim() !== '' &&
           this.form.controls.answer1.value.trim() !== '' &&
           this.form.controls.answer2.value.trim() !== '' &&
           this.form.controls.answer3.value.trim() !== '' &&
           this.form.controls.answer4.value.trim() !== '';
    this.canSubmit.set(isValid);
  }

  constructor() {
    effect(() => {
      if (this.status() === 1 || this.selectedExcelFile() !== null) {
        this.form.disable();
      } else {
        this.form.enable();
        this.checkCanSubmit();
      }
    });

    this.form.valueChanges.subscribe(() => {
      this.checkCanSubmit();
    });

    effect(() => {
      this.selectedExcelFile();
      this.checkCanSubmit();
    });

    this.checkCanSubmit();
  }

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  onSubmit(): void {
    if (this.selectedExcelFile()) {
      this.uploadStatus.set(1);
      this.#questionService.uploadQuestionExcel(this.selectedExcelFile()!).subscribe({
        next: () => {
          this.uploadStatus.set(0);
          this.selectedExcelFile.set(null);
          this.selectedExcelFileName = '';
          this.#notificationService.show('Upload file thành công!', 'success');
          this.createQuestionResult.emit(true);
          this.onOkCancel();
        },
        error: (err: unknown) => {
          this.uploadStatus.set(0);
          const errorMessage = (err && typeof err === 'object' && 'error' in err && typeof err.error === 'string') 
            ? err.error 
            : 'Không thể upload file.';
          this.#notificationService.show(errorMessage, 'error');
          this.createQuestionResult.emit(false);
          this.onOkCancel();
        }
      });
      return;
    }

    this.status.set(1);

    const teacherId = this.#auth.userId;
    if (!teacherId) {
      alert('Bạn chưa được xác thực');
      this.status.set(0);
      return;
    }

    const difficultyLevel = this.form.controls.difficultyLevel.value;
    if (!difficultyLevel || String(difficultyLevel) === '') {
      alert('Mức độ khó là bắt buộc');
      this.status.set(0);
      return;
    }

    const answers = [
      this.form.controls.answer1.value.trim(),
      this.form.controls.answer2.value.trim(),
      this.form.controls.answer3.value.trim(),
      this.form.controls.answer4.value.trim()
    ];

    this.#questionService.addQuestion(
      this.form.controls.questionText.value,
      'MULTIPLE_CHOICE',
      difficultyLevel,
      this.form.controls.subjectName.value,
      teacherId,
      answers
    ).subscribe({
      next: () => {
        this.createQuestionResult.emit(true);
        this.status.set(0);
        this.#notificationService.show('Tạo câu hỏi thành công!', 'success');
        this.onOkCancel();
      },
      error: () => {
        this.createQuestionResult.emit(false);
        this.status.set(0);
        this.#notificationService.show('Không thể tạo câu hỏi', 'error');
        this.onOkCancel();
      }
    });
  }

  protected onClose() {
    this.compRef().destroy();
  }

  protected onOkCancel(val?: string) {
    this.closed.emit(val);
    this.dialog().nativeElement.close(val);
  }

  protected downloadTemplate() {
    this.#questionService.downloadQuestionTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'question-template.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.#notificationService.show('Không thể tải xuống mẫu', 'error');
      }
    });
  }

  protected triggerUpload(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  protected onExcelSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));
    if (!isValid) {
      this.#notificationService.show('Định dạng file không hợp lệ. Vui lòng chọn file Excel (.xlsx/.xls).', 'error');
      input.value = '';
      return;
    }
    this.selectedExcelFile.set(file);
    this.selectedExcelFileName = file.name;
  }

  protected clearSelectedExcel(input: HTMLInputElement) {
    this.selectedExcelFile.set(null);
    this.selectedExcelFileName = '';
    input.value = '';
  }
}
