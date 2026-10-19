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
import { ArticleSearchModalComponent } from '../article-search-modal/article-search-modal.component';
import { Article, ArticleCategory } from '@mmedic/types';
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
    ArticleSearchModalComponent,
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
  readonly categorySeed = signal<string>('');
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
  readonly isSearchingCode = signal<boolean>(false);
  readonly isSearchModalOpen = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  // Computeds
  readonly isEditMode = computed(() => !!this.articleId());

  readonly codePlaceholder = computed(() => {
    if (this.isEditMode()) return 'Ej: CONS-001';
    if (this.categorySeed()) return `${this.categorySeed()}-??? (Automático)`;
    return 'Selecciona categoría para correlativo o escribe para buscar';
  });

  readonly totalPercentage = computed(() => {
    return this.participantRows().reduce(
      (acc, r) => acc + (Number(r.percentage) || 0),
      0
    );
  });

  readonly isFormValid = computed(() => {
    const hasCode = this.isEditMode() ? !!this.code().trim() : true;
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
          this.populateArticle(res.data);
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

  populateArticle(a: Article): void {
    this.articleId.set(a.id);
    this.code.set(a.code);
    this.name.set(a.name);
    this.categoryId.set(a.categoryId);
    this.categorySeed.set(a.category?.seed || '');
    this.price1.set(Number(a.price1));
    this.price2.set(a.price2 !== null && a.price2 !== undefined ? Number(a.price2) : null);
    this.price3.set(a.price3 !== null && a.price3 !== undefined ? Number(a.price3) : null);
    this.price4.set(a.price4 !== null && a.price4 !== undefined ? Number(a.price4) : null);
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
    } else {
      this.participantRows.set([]);
    }
  }

  onCategorySelected(category: ArticleCategory): void {
    this.categoryId.set(category.id);
    this.categorySeed.set(category.seed || '');
  }

  searchByCode(): void {
    const codeVal = this.code().trim();
    if (!codeVal) return;

    this.isSearchingCode.set(true);
    this.articlesService.getArticleByCode(codeVal).subscribe({
      next: (res) => {
        this.isSearchingCode.set(false);
        if (res.success && res.data) {
          this.populateArticle(res.data);
          this.notificationService.success(
            'Modo Edición Activado',
            `Se cargaron los datos del artículo existente '${res.data.code}'.`
          );
        }
      },
      error: (err) => {
        this.isSearchingCode.set(false);
        if (err.status === 404 && !this.isEditMode()) {
          // El código está disponible para crear
          this.notificationService.info(
            'Código libre',
            `El código '${codeVal}' no existe en el catálogo y está disponible.`
          );
        }
      },
    });
  }

  openSearchModal(): void {
    this.isSearchModalOpen.set(true);
  }

  closeSearchModal(): void {
    this.isSearchModalOpen.set(false);
  }

  onArticleSelectedFromModal(article: Article): void {
    this.populateArticle(article);
    this.notificationService.success(
      'Artículo seleccionado',
      `Modo edición activado para '${article.code}'.`
    );
  }

  resetToNew(): void {
    this.articleId.set(null);
    this.code.set('');
    this.name.set('');
    this.categoryId.set('');
    this.categorySeed.set('');
    this.price1.set(null);
    this.price2.set(null);
    this.price3.set(null);
    this.price4.set(null);
    this.isActive.set(true);
    this.appliesVat.set(false);
    this.participantRows.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.notificationService.info('Modo Nuevo Registro', 'Formulario listo para crear un nuevo artículo.');
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

    const rawCode = this.code().trim();
    const payload: any = {
      name: this.name().trim(),
      categoryId: this.categoryId(),
      price1: Number(this.price1()),
      price2: this.price2() !== null ? Number(this.price2()) : null,
      price3: this.price3() !== null ? Number(this.price3()) : null,
      price4: this.price4() !== null ? Number(this.price4()) : null,
      appliesVat: this.appliesVat(),
      participants: validParticipants,
    };

    if (rawCode) {
      payload.code = rawCode;
    }

    const isEditing = this.isEditMode();
    const request$ = isEditing
      ? this.articlesService.updateArticle(this.articleId()!, {
          ...payload,
          code: rawCode,
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
          } else {
            this.notificationService.success(
              'Artículo creado',
              `El artículo se ha registrado con código ${res.data?.code || ''}.`
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
