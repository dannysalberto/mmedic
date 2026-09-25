import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export type MegaTab = 'articles' | 'clinical' | 'billing' | 'patients' | 'config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Mobile drawer state
  readonly isMenuOpen = signal(false);

  // Desktop mega menu state
  readonly isMegaMenuOpen = signal(false);
  readonly activeMegaTab = signal<MegaTab>('articles');

  // Informative modals
  readonly activeModal = signal<'about' | 'contact' | 'who' | null>(null);

  // Active bottom navigation item (mobile)
  readonly activeBottomTab = signal<'home' | 'articles' | 'appointments' | 'patients' | 'more'>('articles');

  toggleMobileMenu(): void {
    this.isMenuOpen.update((v) => !v);
    if (this.isMenuOpen()) {
      this.isMegaMenuOpen.set(false);
    }
  }

  closeMobileMenu(): void {
    this.isMenuOpen.set(false);
  }

  toggleMegaMenu(): void {
    this.isMegaMenuOpen.update((v) => !v);
  }

  openMegaMenu(): void {
    this.isMegaMenuOpen.set(true);
  }

  closeMegaMenu(): void {
    this.isMegaMenuOpen.set(false);
  }

  setMegaTab(tab: MegaTab): void {
    this.activeMegaTab.set(tab);
  }

  selectBottomTab(tab: 'home' | 'articles' | 'appointments' | 'patients' | 'more'): void {
    this.activeBottomTab.set(tab);
    if (tab === 'more') {
      this.toggleMobileMenu();
    } else {
      this.closeMobileMenu();
    }
  }

  openModal(type: 'about' | 'contact' | 'who'): void {
    this.activeModal.set(type);
    this.closeMobileMenu();
    this.closeMegaMenu();
  }

  closeModal(): void {
    this.activeModal.set(null);
  }
}
