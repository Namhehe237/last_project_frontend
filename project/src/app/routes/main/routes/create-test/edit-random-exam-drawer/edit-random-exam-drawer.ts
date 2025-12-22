import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, output, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DrawerComponent } from '#common/components/drawer/drawer';
import { RandomExamQuestionSummary, RandomExamResponse } from '#common/models/RandomExamResponse';
import { ListQuestionContent, ListQuestionResponse } from '#common/models/ListQuestionResponse';
import { QuestionService } from '#common/services/question.service';
import { NotificationService } from '#common/services/notification.service';
import { CommonModule } from '@angular/common';
import { TeacherOption } from '#common/models/TeacherOption';

@Component({
  selector: 'app-edit-random-exam-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DrawerComponent],
  templateUrl: './edit-random-exam-drawer.html',
  styleUrl: './edit-random-exam-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditRandomExamDrawer implements OnChanges {
  readonly isOpen = input.required<boolean>();
  readonly examData = input<RandomExamResponse | null>();
  readonly isSaving = input<boolean>(false);

  readonly closeDrawer = output<void>();
  readonly saveQuestions = output<{ questionIds: number[]; questions: RandomExamQuestionSummary[] }>();

  readonly #questionService = inject(QuestionService);
  readonly #notificationService = inject(NotificationService);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);

  currentQuestions: RandomExamQuestionSummary[] = [];
  filtersForm: FormGroup;
  availableQuestions: ListQuestionContent[] = [];
  availableTotal = 0;
  availablePage = 0;
  availablePageSize = 10;
  isLoadingAvailable = false;
  selectedTeacher: TeacherOption | null = null;

  constructor() {
    this.filtersForm = this.#fb.group({
      difficultyLevel: [''],
      subjectName: [''],
      teacherId: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['examData']) {
      const data = this.examData();
      this.currentQuestions = data?.questions ? [...data.questions] : [];
      if (data) {
        this.loadAvailableQuestions(0);
      }
      this.#cdr.markForCheck();
    }
  }

  removeQuestion(questionId: number) {
    this.currentQuestions = this.currentQuestions.filter(q => q.questionId !== questionId);
    this.#cdr.markForCheck();
  }

  addQuestion(question: ListQuestionContent) {
    const exists = this.currentQuestions.some(q => q.questionId === question.questionId);
    if (exists) {
      this.#notificationService.show('Câu hỏi đã được thêm vào đề thi', 'info');
      return;
    }
    const summary: RandomExamQuestionSummary = {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      subjectName: question.subjectName
    };
    this.currentQuestions = [...this.currentQuestions, summary];
    this.#cdr.markForCheck();
  }

  loadAvailableQuestions(page = 0) {
    this.isLoadingAvailable = true;
    this.availablePage = page;
    const size = this.availablePageSize;

    const difficultyLevelValue = this.filtersForm.get('difficultyLevel')?.value as string | null;
    const subjectNameValue = this.filtersForm.get('subjectName')?.value as string | null;
    
    const difficulty = difficultyLevelValue && difficultyLevelValue.trim() !== '' ? difficultyLevelValue : undefined;
    const subject = subjectNameValue && subjectNameValue.trim() !== '' ? subjectNameValue : undefined;
    const teacherName = this.selectedTeacher?.fullName ?? undefined;

    this.#questionService.getListQuestion(page, size, difficulty, subject, teacherName)
      .subscribe({
        next: (res: ListQuestionResponse) => {
          this.availableQuestions = res.content ?? [];
          this.availableTotal = res.totalElements ?? 0;
          this.isLoadingAvailable = false;
          this.#cdr.markForCheck();
        },
        error: () => {
          this.availableQuestions = [];
          this.availableTotal = 0;
          this.isLoadingAvailable = false;
          this.#notificationService.show('Không thể tải danh sách câu hỏi', 'error');
          this.#cdr.markForCheck();
        }
      });
  }

  onFilterSubmit() {
    this.loadAvailableQuestions(0);
  }

  onClearFilters() {
    this.filtersForm.reset({
      difficultyLevel: '',
      subjectName: '',
      teacherId: null
    });
    this.selectedTeacher = null;
    this.loadAvailableQuestions(0);
  }

  onTeacherSelected(teacher?: TeacherOption): void {
    const teacherIdControl = this.filtersForm.get('teacherId');
    if (!teacherIdControl) {
      return;
    }

    if (!teacher) {
      teacherIdControl.setValue(null);
      this.selectedTeacher = null;
      this.#cdr.markForCheck();
      return;
    }
    
    const teacherId = teacher.teacherId;
    if (teacherId !== undefined && teacherId !== null) {
      teacherIdControl.setValue(teacherId);
      this.selectedTeacher = teacher;
    } else {
      teacherIdControl.setValue(null);
      this.selectedTeacher = null;
    }
    this.#cdr.markForCheck();
  }

  onSave() {
    if (!this.currentQuestions.length) {
      this.#notificationService.show('Đề thi phải chứa ít nhất một câu hỏi', 'info');
      return;
    }
    const questionIds = this.currentQuestions.map(q => q.questionId);
    this.saveQuestions.emit({ questionIds, questions: [...this.currentQuestions] });
  }

  onClose() {
    this.closeDrawer.emit();
  }

  get availableTotalPages(): number {
    return Math.ceil(this.availableTotal / this.availablePageSize) || 0;
  }

  trackQuestionById(_index: number, question: RandomExamQuestionSummary) {
    return question.questionId;
  }

  isQuestionAdded(questionId: number): boolean {
    return this.currentQuestions.some(q => q.questionId === questionId);
  }
}

