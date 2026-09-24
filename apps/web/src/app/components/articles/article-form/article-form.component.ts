import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { NotificationService } from '../../../services/notification.service';
import { CategoryComboboxComponent } from '../category-combobox/category-combobox.component';
import {
  ParticipantsTableComponent,
  ParticipantRow,
} from '../participants-table/participants-table.component';
import { ArticleCategory } from '@mmedic/types';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    CategoryComboboxComponent,
    ParticipantsTableComponent,
  ],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.css'],
})
export class ArticleFormComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form Fields
  readonly articleId = signal<string | null>(null);
  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly categoryId = signal<string>('');
  readonly price1 = signal<number | null>(null);
  readonly price2 = signal<number | null>(null);
  readonly price3 = signal<number | null>(null);
  readonly price4 = signal<number | null>(null);
  readonly isActive = signal<boolean>(true);
  readonly appliesVat = signal<boolean>(false);

  // Participant Rows
  readonly participantRows = signal<ParticipantRow[]>([]);

  // State
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Computeds
  readonly isEditMode = computed(() => !!this.articleId());

  readonly totalPercentage = computed(() => {
    return this.participantRows().reduce(
      (acc, r) => acc + (Number(r.percentage) || 0),
      0
    );
  });

  readonly isFormValid = computed(() => {
    const hasCode = !!this.code().trim();
    const hasName = !!this.name().trim();
    const hasCat = !!this.categoryId();
    const hasP1 = this.price1() !== null && Number(this.price1()) >= 0;
    const validPct = Math.round(this.totalPercentage() * 100) / 100 <= 100.0;
    return hasCode && hasName && hasCat && hasP1 && validPct;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleId.set(id);
      this.loadArticle(id);
    }
  }

  private loadArticle(id: string): void {
    this.isLoading.set(true);
    this.articlesService.getArticleById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const a = res.data;
          this.code.set(a.code);
          this.name.set(a.name);
          this.categoryId.set(a.categoryId);
          this.price1.set(Number(a.price1));
          this.price2.set(a.price2 !== null ? Number(a.price2) : null);
          this.price3.set(a.price3 !== null ? Number(a.price3) : null);
          this.price4.set(a.price4 !== null ? Number(a.price4) : null);
          this.isActive.set(a.isActive);
          this.appliesVat.set(a.appliesVat ?? false);

          if (a.participants?.length) {
            this.participantRows.set(
              a.participants.map((p) => ({
                entityId: p.entityId,
                code: p.entity?.code || '',
                name: p.entity?.name || '',
                status: p.entity?.status || 'ACTIVE',
                percentage: Number(p.percentage),
              }))
            );
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al cargar el artículo'
        );
      },
    });
  }

  onCategorySelected(category: ArticleCategory): void {
    this.categoryId.set(category.id);
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const validParticipants = this.participantRows()
      .filter((r) => r.entityId && Number(r.percentage) > 0)
      .map((r) => ({
        entityId: r.entityId,
        percentage: Number(r.percentage),
      }));

    const payload = {
      code: this.code().trim(),
      name: this.name().trim(),
      categoryId: this.categoryId(),
      price1: Number(this.price1()),
      price2: this.price2() !== null ? Number(this.price2()) : null,
      price3: this.price3() !== null ? Number(this.price3()) : null,
      price4: this.price4() !== null ? Number(this.price4()) : null,
      appliesVat: this.appliesVat(),
      participants: validParticipants,
    };

    const isEditing = this.isEditMode();
    const request$ = isEditing
      ? this.articlesService.updateArticle(this.articleId()!, {
          ...payload,
          isActive: this.isActive(),
        })
      : this.articlesService.createArticle(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          if (isEditing) {
            this.notificationService.success(
              'Artículo actualizado',
              'Los cambios se han guardado exitosamente.'
            );
            this.successMessage.set('Cambios guardados correctamente.');
            // Permanecer en pantalla según la Constitución (Sección 5.4)
          } else {
            this.notificationService.success(
              'Artículo creado',
              'El nuevo artículo se ha registrado exitosamente.'
            );
            this.router.navigate(['/articles']);
          }
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const errMsg = err.error?.message || 'Error al guardar el artículo';
        this.errorMessage.set(errMsg);
        this.notificationService.error('Error al guardar', errMsg);
      },
    });
  }
}

