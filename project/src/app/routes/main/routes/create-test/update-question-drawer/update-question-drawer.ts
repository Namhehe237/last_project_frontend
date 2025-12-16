import { ChangeDetectionStrategy, Component, input, output, inject, ChangeDetectorRef, OnChanges, SimpleChanges, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { QuestionService } from '#common/services/question.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { DrawerComponent } from '#common/components/drawer/drawer';
import { Answer, ListQuestionContent } from '#common/models/ListQuestionResponse';

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY'
}

type QuestionUpdateData = ListQuestionContent & { teacherId?: number };

@Component({
  selector: 'app-update-question-drawer',
  imports: [ReactiveFormsModule, DrawerComponent],
  templateUrl: './update-question-drawer.html',
  styleUrl: './update-question-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateQuestionDrawer implements OnChanges {
  readonly isOpen = input.required<boolean>();
  readonly questionData = input<QuestionUpdateData | null>(null);

  readonly updateQuestionResult = output<boolean>();
  readonly closeDrawer = output<void>();

  readonly #questionService = inject(QuestionService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #fb = inject(FormBuilder);

  readonly DifficultyLevel = DifficultyLevel;
  readonly QuestionType = QuestionType;

  updateForm: FormGroup;
  isLoading = false;
  protected readonly canSubmit = signal<boolean>(false);
  private originalData: {
    questionText: string;
    questionType: QuestionType | '';
    difficultyLevel: DifficultyLevel | '';
    subjectName: string;
    answer1: string;
    answer2: string;
    answer3: string;
    answer4: string;
  } | null = null;

  private checkCanSubmit(): void {
    const questionTypeControl = this.updateForm.controls['questionType'];
    const difficultyLevelControl = this.updateForm.controls['difficultyLevel'];
    const questionTextControl = this.updateForm.controls['questionText'];
    const subjectNameControl = this.updateForm.controls['subjectName'];
    const answer1Control = this.updateForm.controls['answer1'];
    const answer2Control = this.updateForm.controls['answer2'];
    const answer3Control = this.updateForm.controls['answer3'];
    const answer4Control = this.updateForm.controls['answer4'];

    if (!questionTypeControl || !difficultyLevelControl || !questionTextControl || 
        !subjectNameControl || !answer1Control || !answer2Control || 
        !answer3Control || !answer4Control) {
      this.canSubmit.set(false);
      return;
    }

    const questionType = questionTypeControl.value as QuestionType | '' | null;
    const difficultyLevel = difficultyLevelControl.value as DifficultyLevel | '' | null;
    const questionText = String(questionTextControl.value ?? '').trim();
    const subjectName = String(subjectNameControl.value ?? '').trim();
    const answer1 = String(answer1Control.value ?? '').trim();
    const answer2 = String(answer2Control.value ?? '').trim();
    const answer3 = String(answer3Control.value ?? '').trim();
    const answer4 = String(answer4Control.value ?? '').trim();

    const isValid = questionText !== '' &&
           questionType !== null && questionType !== '' &&
           difficultyLevel !== null && difficultyLevel !== '' &&
           subjectName !== '' &&
           answer1 !== '' &&
           answer2 !== '' &&
           answer3 !== '' &&
           answer4 !== '';

    const hasChanged = !this.originalData || 
      questionText !== (this.originalData?.questionText ?? '') ||
      questionType !== (this.originalData?.questionType ?? '') ||
      difficultyLevel !== (this.originalData?.difficultyLevel ?? '') ||
      subjectName !== (this.originalData?.subjectName ?? '') ||
      answer1 !== (this.originalData?.answer1 ?? '') ||
      answer2 !== (this.originalData?.answer2 ?? '') ||
      answer3 !== (this.originalData?.answer3 ?? '') ||
      answer4 !== (this.originalData?.answer4 ?? '');

    this.canSubmit.set(isValid && hasChanged);
  }

  constructor() {
    this.updateForm = this.#fb.group({
      questionText: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      questionType: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      difficultyLevel: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      subjectName: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      answer1: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      answer2: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      answer3: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]],
      answer4: ['', [(control: AbstractControl): ValidationErrors | null => Validators.required(control)]]
    });

    this.updateForm.valueChanges.subscribe(() => {
      this.checkCanSubmit();
    });

    this.checkCanSubmit();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['questionData']) {
      const data = this.questionData();
      if (data) {
        const answers: Answer[] = data.answers ?? [];
        const questionText = (data.questionText ?? '').trim();
        const questionType = (data.questionType ?? '') as QuestionType | '';
        const difficultyLevel = (data.difficultyLevel ?? '') as DifficultyLevel | '';
        const subjectName = (data.subjectName ?? '').trim();
        const answer1 = (answers[0]?.answerText ?? '').trim();
        const answer2 = (answers[1]?.answerText ?? '').trim();
        const answer3 = (answers[2]?.answerText ?? '').trim();
        const answer4 = (answers[3]?.answerText ?? '').trim();

        this.originalData = {
          questionText,
          questionType,
          difficultyLevel,
          subjectName,
          answer1,
          answer2,
          answer3,
          answer4
        };

        this.updateForm.patchValue({
          questionText,
          questionType,
          difficultyLevel,
          subjectName,
          answer1,
          answer2,
          answer3,
          answer4
        });
        this.checkCanSubmit();
      } else {
        this.originalData = null;
      }
    }
  }

  onUpdateQuestion() {
    if (this.updateForm.invalid || !this.questionData()) return;
    this.isLoading = true;

    const teacherId = this.#auth.userId;
    if (!teacherId) {
      this.#notificationService.show('Bạn chưa được xác thực', 'error');
      this.isLoading = false;
      return;
    }

    const formValue = this.updateForm.value as {
      questionText: string;
      questionType: QuestionType | '';
      difficultyLevel: DifficultyLevel | '';
      subjectName: string;
      answer1: string;
      answer2: string;
      answer3: string;
      answer4: string;
    };

    if (!formValue.questionType || String(formValue.questionType) === '') {
      this.#notificationService.show('Loại câu hỏi là bắt buộc', 'error');
      this.isLoading = false;
      return;
    }

    if (!formValue.difficultyLevel || String(formValue.difficultyLevel) === '') {
      this.#notificationService.show('Mức độ khó là bắt buộc', 'error');
      this.isLoading = false;
      return;
    }

    const answers = [
      formValue.answer1.trim(),
      formValue.answer2.trim(),
      formValue.answer3.trim(),
      formValue.answer4.trim()
    ];

    this.#questionService.updateQuestion(
      this.questionData()!.questionId,
      formValue.questionText,
      formValue.questionType,
      formValue.difficultyLevel,
      formValue.subjectName,
      teacherId,
      answers
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.#notificationService.show('Cập nhật câu hỏi thành công!', 'success');
        this.updateQuestionResult.emit(true);
        this.closeDrawer.emit();
      },
      error: () => {
        this.isLoading = false;
        this.#notificationService.show('Không thể cập nhật câu hỏi', 'error');
        this.updateQuestionResult.emit(false);
        this.closeDrawer.emit();
        this.#cdr.markForCheck();
      }
    });
  }

  onClose() {
    this.closeDrawer.emit();
  }
}
