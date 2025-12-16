import { ChangeDetectionStrategy, Component, ChangeDetectorRef, inject, OnInit, OnDestroy, ElementRef, viewChild } from '@angular/core';
import { UserService } from '#common/services/user.service';
import { UserInfoResponse } from '#common/models/UserInfoResponse';
import { NotificationService } from '#common/services/notification.service';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ImageUploaderComponent, UploadedImage } from '#common/components/image-uploader/image-uploader.component';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-manage-account',
  imports: [ReactiveFormsModule, ImageUploaderComponent],
  templateUrl: './manage-account.html',
  styleUrl: './manage-account.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageAccount implements OnInit, OnDestroy {
  readonly #userService = inject(UserService);
  readonly #notificationService = inject(NotificationService);
  readonly #route = inject(ActivatedRoute);
  readonly cdr = inject(ChangeDetectorRef);

  readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');
  readonly imageModal  = viewChild<ElementRef<HTMLDialogElement>>('imageModal');
  readonly modalImage  = viewChild<ElementRef<HTMLImageElement>>('modalImage');
  
  userId = 0;
  isLoading = false;
  avatarImages: UploadedImage[] = [];
  originalUserInfo: UserInfoResponse | null = null;
  originalAvatarUrl = '';
  private formValueChangesSubscription?: Subscription;

  userInfo: UserInfoResponse = {
    userId: 0,
    email: '',
    fullName: '',
    avatarUrl: '',
    phoneNumber: '',
    roleName: '',
    password: ''
  };

  userForm = new FormGroup({
    fullName: new FormControl('', [control => Validators.required(control)]),
    email: new FormControl('', [
      control => Validators.required(control),
      control => Validators.email(control)
    ]),
    phoneNumber: new FormControl('', [
      control => this.phoneNumberValidator(control)
    ]),
    password: new FormControl('')
  });

  ngOnInit(): void {
    this.userId = Number(this.#route.snapshot.paramMap.get('userId')) || 0;
    
    if (this.userId === 0) {
      this.#notificationService.show('ID người dùng không hợp lệ!', 'error');
      return;
    }
    
    this.formValueChangesSubscription = this.userForm.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
    
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    this.formValueChangesSubscription?.unsubscribe();
  }

  private phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^\d{10}$/;
    const value = String(control.value);
    if (!phoneRegex.test(value)) {
      return { phoneNumber: true };
    }
    return null;
  }

  loadUserInfo(): void {
    this.isLoading = true;
    this.#userService.getUserInfo(this.userId).subscribe({
      next: (data: UserInfoResponse) => {
        this.userInfo = data;
        this.originalUserInfo = { ...data };
        this.originalAvatarUrl = data.avatarUrl || '';
        this.populateForm();
        this.setupExistingAvatar();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.#notificationService.show('Lỗi khi tải thông tin người dùng!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  populateForm(): void {
    this.userForm.patchValue({
      fullName: this.userInfo.fullName,
      email: this.userInfo.email,
      phoneNumber: this.userInfo.phoneNumber,
      password: ''
    });
  }

  private setupExistingAvatar(): void {
    if (this.userInfo.avatarUrl) {
      const existingAvatar: UploadedImage = {
        id: 'existing-avatar',
        file: new File([], 'existing-avatar'),
        url: this.userInfo.avatarUrl,
        name: 'Ảnh đại diện hiện tại',
        base64String: ''
      };
      this.avatarImages = [existingAvatar];
    }
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid || this.isLoading) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValues = this.userForm.value;
    
    if (this.avatarImages.length > 0 && this.avatarImages[0]?.file) {
      const avatarFile = this.avatarImages[0].file;
      
      if (avatarFile.size > 0 && avatarFile.name !== 'existing-avatar') {
        try {
          this.isLoading = true;
          this.cdr.markForCheck();
          
          const avatarUrl = await firstValueFrom(this.#userService.uploadAvatar(avatarFile));
          if (avatarUrl) {
            this.userInfo.avatarUrl = avatarUrl;
            this.#notificationService.show('Avatar đã được upload thành công!', 'success');
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          this.#notificationService.show('Lỗi khi upload avatar. Vui lòng thử lại.', 'error');
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }
      }
    }

    this.userInfo = {
      ...this.userInfo,
      fullName: formValues.fullName ?? '',
      email: formValues.email ?? '',
      phoneNumber: formValues.phoneNumber ?? '',
      password: formValues.password ?? ''
    };

    this.updateUserInfo();
  }

  private updateUserInfo(): void {
    this.isLoading = true;
    this.#userService.updateUserInfo(
      this.userId,
      this.userInfo.email,
      this.userInfo.password,
      this.userInfo.fullName,
      this.userInfo.phoneNumber,
      this.userInfo.avatarUrl
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.#notificationService.show('Cập nhật thông tin người dùng thành công!', 'success');
        
        this.userForm.patchValue({ password: '' });
        this.originalUserInfo = { ...this.userInfo };
        this.originalAvatarUrl = this.userInfo.avatarUrl || '';
        this.setupExistingAvatar();
        
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        console.error('Error updating user info:', error);
        this.#notificationService.show('Lỗi khi cập nhật thông tin người dùng!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  onImagesChanged(newImages: UploadedImage[]): void {
    this.avatarImages = newImages;
    this.cdr.markForCheck();
  }

  onImageRemoved(imageId: string): void {
    console.log('Avatar removed:', imageId);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.touched && field?.errors) {
      const errors = field.errors;
      if (errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} là bắt buộc`;
      }
      if (errors['email']) {
        return 'Vui lòng nhập địa chỉ email hợp lệ';
      }
      if (errors['phoneNumber']) {
        return 'Số điện thoại phải có đúng 10 chữ số';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      fullName: 'Họ và tên',
      email: 'Địa chỉ email',
      phoneNumber: 'Số điện thoại'
    };
    return displayNames[fieldName] ?? fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.touched && field?.errors);
  }

  get isSubmitDisabled(): boolean {
    return this.userForm.invalid || this.isLoading || !this.hasFormChanged();
  }

  private hasFormChanged(): boolean {
    if (!this.originalUserInfo) {
      return false;
    }

    const formValues = this.userForm.value;
    
    const normalize = (value: string | null | undefined): string => {
      return (value ?? '').trim();
    };
    
    if (normalize(formValues.fullName) !== normalize(this.originalUserInfo.fullName)) {
      return true;
    }
    if (normalize(formValues.email) !== normalize(this.originalUserInfo.email)) {
      return true;
    }
    if (normalize(formValues.phoneNumber) !== normalize(this.originalUserInfo.phoneNumber)) {
      return true;
    }
    if (formValues.password && formValues.password.trim() !== '') {
      return true;
    }

    // Check if avatar has changed
    if (this.avatarImages.length > 0 && this.avatarImages[0]?.file) {
      const avatarFile = this.avatarImages[0].file;
      if (avatarFile.size > 0 && avatarFile.name !== 'existing-avatar') {
        return true;
      }
    } else if (this.originalAvatarUrl && this.avatarImages.length === 0) {
      // Avatar was removed
      return true;
    }

    return false;
  }
}