import {Component, input, output, computed, effect, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawerComponent {
  readonly isOpen = input.required<boolean>();
  readonly moreClass = input<string>('');
  readonly title = input<string>('');
  readonly closeOnBackdropClick = input<boolean>(true);
  readonly position = input<'left' | 'right'>('right');
  readonly showCloseIcon = input<boolean>(true);

  closeDrawer = output<void>();
  opened = output<void>();
  closed = output<void>();

  // Computed properties for dynamic styling
  readonly drawerClasses = computed(() => {
    const baseClasses = 'fixed top-0 h-full px-[40px] bg-[#f7f7f7] shadow-xl z-50 transition-transform duration-300 ease-in-out';
    const positionClass = this.position() === 'right' ? 'right-0' : 'left-0';
    const transformClass = this.isOpen()
      ? 'translate-x-0'
      : this.position() === 'right'
        ? 'translate-x-full'
        : '-translate-x-full';

    return `${baseClasses} ${positionClass} ${transformClass} ${this.moreClass()}`;
  });

  readonly backdropClasses = computed(() => {
    return this.isOpen()
      ? 'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-100'
      : 'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-0 pointer-events-none';
  });

  onBackdropClick() {
    if (this.closeOnBackdropClick()) {
      this.close();
    }
  }

  close() {
    this.closeDrawer.emit();
    this.closed.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  // Lifecycle effects
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.opened.emit();
        // Prevent body scroll when drawer is open
        document.body.style.overflow = 'hidden';
      } else {
        // Restore body scroll when drawer is closed
        document.body.style.overflow = '';
      }
    });
  }
}
