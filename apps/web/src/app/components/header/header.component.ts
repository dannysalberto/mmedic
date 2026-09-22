import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  readonly isMenuOpen = signal(false);
  readonly activeModal = signal<'about' | 'contact' | 'who' | null>(null);

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  openModal(type: 'about' | 'contact' | 'who') {
    this.activeModal.set(type);
    this.isMenuOpen.set(false);
  }

  closeModal() {
    this.activeModal.set(null);
  }
}
