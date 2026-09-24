import { Component, OnInit, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticlesService } from '../../../services/articles.service';
import { EntitiesService } from '../../../services/entities.service';
import { ContributorsService } from '../../../services/contributors.service';
import { NotificationService } from '../../../services/notification.service';
import { calculateInvoiceItem, calculateInvoiceTotals } from '../../../services/invoices-calc.util';
import { Article, Entity, Contributor, PriceType } from '@mmedic/types';

export interface InvoiceItemRowState {
  id: string;
  articleId: string;
  selectedArticle: Article | null;
  searchQuery: string;
  isSearching?: boolean;
  notFound?: boolean;
  searchResults?: Article[];
  contributorId: string;
  entityId?: string;
  priceType: PriceType;
  quantity: number;
  basePrice: number;
  vatAmount: number;
  subtotal: number;
  total: number;
}

@Component({
  selector: 'app-invoice-items-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-items-table.component.html',
  styleUrls: ['./invoice-items-table.component.css'],
})
export class InvoiceItemsTableComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly entitiesService = inject(EntitiesService);
  private readonly contributorsService = inject(ContributorsService);
  private readonly notificationService = inject(NotificationService);

  @Output() itemsChanged = new EventEmitter<InvoiceItemRowState[]>();
  @Output() totalsChanged = new EventEmitter<{ subtotal: number; vatAmount: number; total: number }>();

  readonly availableArticles = signal<Article[]>([]);
  readonly availableEntities = signal<Entity[]>([]);
  readonly availableContributors = signal<Contributor[]>([]);
  readonly rows = signal<InvoiceItemRowState[]>([]);

  // Modal de selección múltiple de artículos
  readonly showArticleModal = signal<boolean>(false);
  readonly articleListForPicker = signal<Article[]>([]);
  readonly articleSearchFilter = signal<string>('');
  readonly selectedArticleIdsModal = signal<Set<string>>(new Set());
  targetRowForModal: InvoiceItemRowState | null = null;

  readonly totals = computed(() => {
    return calculateInvoiceTotals(this.rows());
  });

  ngOnInit(): void {
    this.articlesService.getArticles(undefined, undefined, true).subscribe((res) => {
      if (res.success && res.data) {
        this.availableArticles.set(res.data);
      }
    });

    this.entitiesService.getEntities(undefined, 'ACTIVE').subscribe((res) => {
      if (res.success && res.data) {
        this.availableEntities.set(res.data);
      }
    });

    this.contributorsService.getContributors(undefined, 'ACTIVE').subscribe((res) => {
      if (res.success && res.data) {
        this.availableContributors.set(res.data);
        // Si hay renglones sin médico asignado, asignar el primero como predeterminado
        if (res.data.length > 0) {
          const firstContrib = res.data[0];
          this.rows.update((list) =>
            list.map((r) => {
              if (!r.contributorId) {
                return {
                  ...r,
                  contributorId: firstContrib.id,
                  entityId: firstContrib.entityId || r.entityId,
                };
              }
              return r;
            })
          );
        }
      }
    });

    // Iniciar con 1 renglón vacío
    this.addRow();
  }

  addRow(): void {
    const defaultContrib = this.availableContributors().length > 0 ? this.availableContributors()[0] : null;
    const defaultEntityId = this.availableEntities().length > 0 ? this.availableEntities()[0].id : '';

    const newRow: InvoiceItemRowState = {
      id: Math.random().toString(36).substring(2, 9),
      articleId: '',
      selectedArticle: null,
      searchQuery: '',
      isSearching: false,
      notFound: false,
      searchResults: [],
      contributorId: defaultContrib?.id || '',
      entityId: defaultContrib?.entityId || defaultEntityId,
      priceType: 'PRICE_1',
      quantity: 1,
      basePrice: 0,
      vatAmount: 0,
      subtotal: 0,
      total: 0,
    };

    this.rows.update((list) => [...list, newRow]);
    this.emitChanges();
  }

  removeRow(index: number): void {
    this.rows.update((list) => list.filter((_, i) => i !== index));
    if (this.rows().length === 0) {
      this.addRow();
    } else {
      this.emitChanges();
    }
  }

  openArticleSearchModal(targetRow?: InvoiceItemRowState): void {
    this.targetRowForModal = targetRow || null;
    const initialSet = new Set<string>();
    if (targetRow?.selectedArticle) {
      initialSet.add(targetRow.selectedArticle.id);
    }
    this.selectedArticleIdsModal.set(initialSet);
    this.articleSearchFilter.set('');
    this.showArticleModal.set(true);
    this.filterArticlesForPicker('');
  }

  closeArticleSearchModal(): void {
    this.showArticleModal.set(false);
    this.targetRowForModal = null;
  }

  filterArticlesForPicker(query = ''): void {
    const q = query.trim().toLowerCase();
    const all = this.availableArticles();
    if (!q) {
      this.articleListForPicker.set(all);
      return;
    }
    const filtered = all.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    );
    this.articleListForPicker.set(filtered);
  }

  toggleArticleSelectionModal(articleId: string): void {
    this.selectedArticleIdsModal.update((current) => {
      const updated = new Set(current);
      if (updated.has(articleId)) {
        updated.delete(articleId);
      } else {
        updated.add(articleId);
      }
      return updated;
    });
  }

  isArticleSelectedInModal(articleId: string): boolean {
    return this.selectedArticleIdsModal().has(articleId);
  }

  areAllArticlesSelectedModal(): boolean {
    const currentList = this.articleListForPicker();
    if (!currentList.length) return false;
    return currentList.every((a) => this.selectedArticleIdsModal().has(a.id));
  }

  toggleSelectAllArticlesModal(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const currentList = this.articleListForPicker();
    this.selectedArticleIdsModal.update((current) => {
      const updated = new Set(current);
      currentList.forEach((a) => {
        if (checked) {
          updated.add(a.id);
        } else {
          updated.delete(a.id);
        }
      });
      return updated;
    });
  }

  confirmArticleModalSelection(): void {
    const selectedIds = Array.from(this.selectedArticleIdsModal());
    if (!selectedIds.length) {
      this.closeArticleSearchModal();
      return;
    }

    const allArticles = this.availableArticles();
    const selectedArticles = selectedIds
      .map((id) => allArticles.find((a) => a.id === id))
      .filter((a): a is Article => a !== undefined);

    if (!selectedArticles.length) {
      this.closeArticleSearchModal();
      return;
    }

    // 1. Si se abrió desde un renglón específico
    let articlesToAppend = selectedArticles;
    if (this.targetRowForModal) {
      const firstArt = selectedArticles[0];
      this.selectArticleForRow(this.targetRowForModal, firstArt);
      articlesToAppend = selectedArticles.slice(1);
    }

    // 2. Para el resto de artículos seleccionados, agregar renglones nuevos
    for (const art of articlesToAppend) {
      // Buscar si el último renglón es totalmente vacío
      const rows = this.rows();
      const emptyRow = rows.find((r) => !r.selectedArticle && !r.articleId);

      if (emptyRow) {
        this.selectArticleForRow(emptyRow, art);
      } else {
        const defaultContrib = this.availableContributors().length > 0 ? this.availableContributors()[0] : null;
        const defaultEntityId = this.availableEntities().length > 0 ? this.availableEntities()[0].id : '';

        const newRow: InvoiceItemRowState = {
          id: Math.random().toString(36).substring(2, 9),
          articleId: art.id,
          selectedArticle: art,
          searchQuery: art.code,
          isSearching: false,
          notFound: false,
          searchResults: [],
          contributorId: defaultContrib?.id || '',
          entityId: defaultContrib?.entityId || (art.participants?.length ? art.participants[0].entityId : defaultEntityId),
          priceType: 'PRICE_1',
          quantity: 1,
          basePrice: 0,
          vatAmount: 0,
          subtotal: 0,
          total: 0,
        };
        this.rows.update((list) => [...list, newRow]);
        this.recalculateRow(newRow);
      }
    }

    this.emitChanges();
    this.notificationService.success(
      'Artículos agregados',
      `Se incorporaron ${selectedArticles.length} artículo(s) a la factura.`
    );
    this.closeArticleSearchModal();
  }

  searchArticle(row: InvoiceItemRowState, event?: Event): void {
    if (event instanceof KeyboardEvent && event.key === 'Tab' && row.selectedArticle) {
      return;
    }

    const query = row.searchQuery ? row.searchQuery.trim() : '';
    if (!query) {
      row.notFound = false;
      row.searchResults = [];
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const articles = this.availableArticles();

    // 1. Coincidencia exacta por código
    const exactCodeMatch = articles.find(
      (a) => a.code.toLowerCase() === normalizedQuery
    );

    if (exactCodeMatch) {
      this.selectArticleForRow(row, exactCodeMatch);
      return;
    }

    // 2. Coincidencia por código parcial o nombre
    const matches = articles.filter(
      (a) =>
        a.code.toLowerCase().includes(normalizedQuery) ||
        a.name.toLowerCase().includes(normalizedQuery)
    );

    if (matches.length === 1) {
      this.selectArticleForRow(row, matches[0]);
      return;
    } else if (matches.length > 1) {
      row.searchResults = matches;
      row.notFound = false;
      return;
    }

    // 3. Fallback: Buscar en backend si no se encontró localmente
    row.isSearching = true;
    this.articlesService.getArticles(query, undefined, true).subscribe({
      next: (res) => {
        row.isSearching = false;
        const apiMatches = res.data || [];
        if (apiMatches.length === 1) {
          this.selectArticleForRow(row, apiMatches[0]);
        } else if (apiMatches.length > 1) {
          row.searchResults = apiMatches;
          row.notFound = false;
        } else {
          row.notFound = true;
          row.searchResults = [];
          this.notificationService.warning(
            'Artículo no encontrado',
            `No se encontró ningún artículo con el código o término "${query}".`
          );
        }
      },
      error: () => {
        row.isSearching = false;
        row.notFound = true;
        row.searchResults = [];
      },
    });
  }

  onArticleInputBlur(row: InvoiceItemRowState): void {
    setTimeout(() => {
      if (row.searchQuery?.trim() && !row.selectedArticle && (!row.searchResults || row.searchResults.length === 0)) {
        this.searchArticle(row);
      }
    }, 200);
  }

  selectArticleForRow(row: InvoiceItemRowState, article: Article): void {
    row.articleId = article.id;
    row.selectedArticle = article;
    row.searchQuery = article.code;
    row.notFound = false;
    row.searchResults = [];

    this.recalculateRow(row);
  }

  clearArticleSelection(row: InvoiceItemRowState): void {
    row.articleId = '';
    row.selectedArticle = null;
    row.searchQuery = '';
    row.notFound = false;
    row.searchResults = [];
    this.recalculateRow(row);
  }

  onArticleChange(row: InvoiceItemRowState, articleId: string): void {
    const article = this.availableArticles().find((a) => a.id === articleId) || null;
    if (article) {
      this.selectArticleForRow(row, article);
    } else {
      this.clearArticleSelection(row);
    }
  }

  onPriceTypeChange(row: InvoiceItemRowState, priceType: PriceType): void {
    row.priceType = priceType;
    this.recalculateRow(row);
  }

  onQuantityChange(row: InvoiceItemRowState, qty: number): void {
    row.quantity = Math.max(0.001, Number(qty) || 1);
    this.recalculateRow(row);
  }

  onContributorChange(row: InvoiceItemRowState, contributorId: string): void {
    row.contributorId = contributorId;
    const contrib = this.availableContributors().find((c) => c.id === contributorId);
    if (contrib && contrib.entityId) {
      row.entityId = contrib.entityId;
    }
    this.rows.update((list) => [...list]);
    this.emitChanges();
  }

  recalculateRow(row: InvoiceItemRowState): void {
    if (!row.selectedArticle) {
      row.basePrice = 0;
      row.vatAmount = 0;
      row.subtotal = 0;
      row.total = 0;
      this.rows.update((list) => [...list]);
      this.emitChanges();
      return;
    }

    let unitPrice = Number(row.selectedArticle.price1);
    if (row.priceType === 'PRICE_2' && row.selectedArticle.price2 !== null && row.selectedArticle.price2 !== undefined) {
      unitPrice = Number(row.selectedArticle.price2);
    } else if (row.priceType === 'PRICE_3' && row.selectedArticle.price3 !== null && row.selectedArticle.price3 !== undefined) {
      unitPrice = Number(row.selectedArticle.price3);
    } else if (row.priceType === 'PRICE_4' && row.selectedArticle.price4 !== null && row.selectedArticle.price4 !== undefined) {
      unitPrice = Number(row.selectedArticle.price4);
    }

    const calc = calculateInvoiceItem(
      unitPrice,
      row.quantity,
      row.selectedArticle.appliesVat ?? false,
    );

    row.basePrice = calc.basePrice;
    row.vatAmount = calc.vatAmount;
    row.subtotal = calc.subtotal;
    row.total = calc.total;

    this.rows.update((list) => [...list]);
    this.emitChanges();
  }

  private emitChanges(): void {
    this.itemsChanged.emit(this.rows());
    this.totalsChanged.emit(this.totals());
  }
}
