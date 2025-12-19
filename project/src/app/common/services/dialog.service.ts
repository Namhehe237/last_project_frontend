import { inject, Injectable, ViewContainerRef } from '@angular/core';
import { DialogComponent } from '../components/dialog/dialog.component';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { DialogAddUser } from '../../routes/main/routes/manage-user/dialog-add-user/dialog-add-user';
import { DialogCreateClass } from '../../routes/main/routes/manage-class/dialog-create-class/dialog-create-class';
import { DialogJoinClass } from '../../routes/main/routes/my-class-student/dialog-join-class/dialog-join-class';
import { DialogCreateQuestion } from '../../routes/main/routes/create-test/dialog-create-question/dialog-create-question';
import { DialogExamStudents } from '../../routes/main/routes/exam-management/dialog-exam-students/dialog-exam-students';
import { DialogConfirmSubmit } from '../../routes/main/routes/do-test/dialog-confirm-submit/dialog-confirm-submit';
import { TeacherExam } from '#common/models/TeacherExam';
@Injectable({
  providedIn: 'root'
})
export class DialogService {
	readonly #vcr = inject(ViewContainerRef);
	
	open(data: {title: string, content: string[]}): DialogComponent {
		const compRef = this.#vcr.createComponent(DialogComponent);

		compRef.setInput('compRef', compRef);
		compRef.setInput('data', data);
		// compRef.changeDetectorRef.detectChanges();
		compRef.instance.open();

		return compRef.instance;
	}

	openSpinner(): SpinnerComponent {
		const compRef = this.#vcr.createComponent(SpinnerComponent);
		compRef.setInput('compRef', compRef);
		
		// compRef.changeDetectorRef.detectChanges();
		compRef.instance.open();

		return compRef.instance;
	}

	openDialogAddUser(): DialogAddUser {
		const compRef = this.#vcr.createComponent(DialogAddUser);

		compRef.setInput('compRef', compRef);
		// compRef.changeDetectorRef.detectChanges();
		compRef.instance.open();

		return compRef.instance;
	}

	openDialogAddClass(): DialogCreateClass {
		const compRef = this.#vcr.createComponent(DialogCreateClass);

		compRef.setInput('compRef', compRef);
		// compRef.changeDetectorRef.detectChanges();
		compRef.instance.open();

		return compRef.instance;
	}

	openDialogJoinClass(): DialogJoinClass {
		const compRef = this.#vcr.createComponent(DialogJoinClass);

		compRef.setInput('compRef', compRef);
		// compRef.changeDetectorRef.detectChanges();
		compRef.instance.open();

		return compRef.instance;
	}

  openDialogCreateQuestion(): DialogCreateQuestion {
    const compRef = this.#vcr.createComponent(DialogCreateQuestion);
    compRef.setInput('compRef', compRef);
    // compRef.changeDetectorRef.detectChanges();
    compRef.instance.open();
    return compRef.instance;
  }

  openDialogExamStudents(exam: TeacherExam): DialogExamStudents {
    const compRef = this.#vcr.createComponent(DialogExamStudents);
    compRef.setInput('compRef', compRef);
    compRef.setInput('exam', exam);
    // compRef.changeDetectorRef.detectChanges();
    compRef.instance.open();
    return compRef.instance;
  }

  openDialogConfirmSubmit(remainingTime: string): DialogConfirmSubmit {
    const compRef = this.#vcr.createComponent(DialogConfirmSubmit);
    compRef.setInput('compRef', compRef);
    compRef.setInput('remainingTime', remainingTime);
    // compRef.changeDetectorRef.detectChanges();
    compRef.instance.open();
    return compRef.instance;
  }
}
