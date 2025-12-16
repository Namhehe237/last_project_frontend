import { ChangeDetectionStrategy, Component, inject, viewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';
import { QuestionService } from '#common/services/question.service';
import { DialogService } from '#common/services/dialog.service';
import { NotificationService } from '#common/services/notification.service';
import { AddExamDetailDrawer } from './add-exam-detail-drawer/add-exam-detail-drawer';
import { UpdateQuestionDrawer } from './update-question-drawer/update-question-drawer';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ListQuestionContent } from '#common/models/ListQuestionResponse';
import { RandomExamQuestionSummary, RandomExamResponse } from '#common/models/RandomExamResponse';
import { EditRandomExamDrawer } from './edit-random-exam-drawer/edit-random-exam-drawer';
import { ExamService } from '#common/services/exam.service';
import { AuthService } from '#common/services/auth.service';
import { TeacherOption } from '#common/models/TeacherOption';

interface QuestionRow extends ListQuestionContent, TableRowData {
  isSelected: boolean;
  questionTextHref: () => void;
}

type QuestionUpdateData = ListQuestionContent & { teacherId?: number };

@Component({
  selector: 'app-create-test',
  imports: [TableComponent, AddExamDetailDrawer, UpdateQuestionDrawer, ReactiveFormsModule, EditRandomExamDrawer],
  templateUrl: './create-test.html',
  styleUrl: './create-test.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTest implements OnInit {
  readonly #questionService = inject(QuestionService);
  readonly #dialogService = inject(DialogService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #fb = inject(FormBuilder);
  readonly #examService = inject(ExamService);
  readonly #auth = inject(AuthService);

  readonly dataTable = viewChild<TableComponent>('dataTable');

  filtersForm: FormGroup;
  selectedTeacher: TeacherOption | null = null;
  
  questions: QuestionRow[] = [];
  totalElements = 0;
  isLoading = false;

  isUpdateDrawerOpen = false;
  selectedQuestionForUpdate: QuestionUpdateData | null = null;

  isCreateExamDrawerOpen = false;
  isRandomEditDrawerOpen = false;
  randomExamData: RandomExamResponse | null = null;
  isSavingRandomExam = false;

  constructor() {
    this.filtersForm = this.#fb.group({
      difficultyLevel: [''],
      subjectName: [''],
      teacherId: [null]
    });
  }

  columns: ColumnInterface[] = [
    { title: 'Câu hỏi', field: 'questionText', isCheckbox: true, isStickyFirst: true },
    { title: 'Loại', field: 'questionType' },
    { title: 'Độ khó', field: 'difficultyLevel' },
    { title: 'Môn học', field: 'subjectName' },
    { title: 'Hành động', field: 'action', isAction: true, isStickyEnd: true, width: 220 },
  ];

  ngOnInit(): void {
    this.search(true);
  }

  search(isSearch: boolean) {
    if (isSearch) {
      const table = this.dataTable();
      if (table) table.page = 1;
    }

    this.isLoading = true;
    const pageNumber = this.dataTable()?.page ?? 1;
    const pageSize = this.dataTable()?.pageSize ?? 20;

    const difficultyLevelValue = this.filtersForm.get('difficultyLevel')?.value as string | null;
    const subjectNameValue = this.filtersForm.get('subjectName')?.value as string | null;
    
    const difficultyLevel = difficultyLevelValue && difficultyLevelValue.trim() !== '' ? difficultyLevelValue : undefined;
    const subjectName = subjectNameValue && subjectNameValue.trim() !== '' ? subjectNameValue : undefined;
    const teacherName = this.selectedTeacher?.fullName ?? undefined;

    this.#questionService.getListQuestion(
      pageNumber - 1,
      pageSize,
      difficultyLevel,
      subjectName,
      teacherName
    )
      .subscribe({
        next: (res) => {
          const content: readonly ListQuestionContent[] = res.content ?? [];
          this.questions = content.map((q): QuestionRow => ({
            ...q,
            questionTextHref: () => {
              this.selectedQuestionForUpdate = q as QuestionUpdateData;
              this.isUpdateDrawerOpen = true;
              this.#cdr.markForCheck();
            },
            isSelected: false
          }));
          this.totalElements = res.totalElements ?? 0;
          this.isLoading = false;
          this.#cdr.markForCheck();
        },
        error: () => {
          this.questions = [];
          this.totalElements = 0;
          this.isLoading = false;
          this.#cdr.markForCheck();
        }
      });
  }

  reloadData() {
    this.search(false);
  }

  openCreateQuestionDialog() {
    const dialog = this.#dialogService.openDialogCreateQuestion();
    dialog.createQuestionResult.subscribe(result => {
      if (result) {
        this.resetFilters();
      }
    });
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

  private isQuestionRow(row: TableRowData): row is QuestionRow {
    return typeof (row as unknown as { questionId?: unknown }).questionId === 'number';
  }

  onActionClick(event: { action: string; data: TableRowData; field?: string; anchor?: HTMLElement; }) {
    const { action, data } = event;
    if (action === 'delete-question' && this.isQuestionRow(data)) {
      this.isLoading = true;
      this.#questionService.deleteQuestion([data.questionId]).subscribe({
        next: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa câu hỏi thành công!', 'success');
          this.reloadData();
        },
        error: () => {
          this.isLoading = false;
          this.#notificationService.show('Xóa câu hỏi thất bại!', 'error');
          this.#cdr.markForCheck();
        }
      });
    } else if (action === 'update-question' && this.isQuestionRow(data)) {
      this.selectedQuestionForUpdate = data;
      this.isUpdateDrawerOpen = true;
      this.#cdr.markForCheck();
    }
  }

  onUpdateQuestionResult(result: boolean) {
    if (result) {
      this.reloadData();
    }
  }

  onCloseUpdateDrawer() {
    this.isUpdateDrawerOpen = false;
    this.selectedQuestionForUpdate = null;
  	document.body.style.overflow = '';
    this.#cdr.markForCheck();
  }

  get selectedQuestionIds(): number[] {
    const table = this.dataTable();
    if (table) {
      return table.getSelectedRowIds().map(id => Number(id));
    }
    return [];
  }

  openCreateExamDrawer() {
    this.isCreateExamDrawerOpen = true;
    this.#cdr.markForCheck();
  }

  onCloseCreateExamDrawer() {
    this.isCreateExamDrawerOpen = false;
    this.clearSelections();
    document.body.style.overflow = '';
    this.#cdr.markForCheck();
  }

  onRandomExamReady(data: RandomExamResponse) {
    this.isCreateExamDrawerOpen = false;
    this.randomExamData = data;
    this.isRandomEditDrawerOpen = true;
    this.#cdr.markForCheck();
  }

  onCloseRandomEditDrawer() {
    this.isRandomEditDrawerOpen = false;
    this.randomExamData = null;
    this.isSavingRandomExam = false;
    document.body.style.overflow = '';
    this.#cdr.markForCheck();
  }

  onSaveRandomExamQuestions(payload: { questionIds: number[]; questions: RandomExamQuestionSummary[] }) {
    if (!this.randomExamData) {
      return;
    }
    this.isSavingRandomExam = true;
    this.#cdr.markForCheck();
    this.#examService.updateExamQuestions(this.randomExamData.examId, payload.questionIds).subscribe({
      next: () => {
        this.isSavingRandomExam = false;
        const updated: RandomExamResponse = {
          ...this.randomExamData!,
          questions: payload.questions
        };
        this.randomExamData = updated;
        this.#notificationService.show('Tạo đề thi thành công!', 'success');
        this.reloadData();
        this.isRandomEditDrawerOpen = false;
        this.randomExamData = null;
        this.isSavingRandomExam = false;
        document.body.style.overflow = '';
        this.#cdr.markForCheck();
      },
      error: () => {
        this.isSavingRandomExam = false;
        this.#notificationService.show('Tạo đề thi thất bại!', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  get isAdmin(): boolean {
    return this.#auth.role === 'ADMIN';
  }

  clearSelections() {
    const table = this.dataTable();
    if (table) {
      table.clearSelection();
    }
  }

  resetFilters() {
    this.filtersForm.reset({
      difficultyLevel: '',
      subjectName: '',
      teacherId: null
    });
    this.selectedTeacher = null;
    this.onTeacherSelected(undefined);
    this.reloadData();
    this.#cdr.markForCheck();
  }

  deleteSelectedQuestions() {
    const selectedIds = this.selectedQuestionIds;
    if (selectedIds.length === 0) {
      this.#notificationService.show('Vui lòng chọn ít nhất một câu hỏi để xóa', 'error');
      return;
    }

    this.isLoading = true;
    this.#cdr.markForCheck();
    this.#questionService.deleteQuestion(selectedIds).subscribe({
      next: () => {
        this.isLoading = false;
        this.#notificationService.show(`Xóa ${selectedIds.length} câu hỏi thành công!`, 'success');
        this.clearSelections();
        this.reloadData();
      },
      error: () => {
        this.isLoading = false;
        this.#notificationService.show('Xóa câu hỏi thất bại!', 'error');
        this.#cdr.markForCheck();
      }
    });
  }
}
