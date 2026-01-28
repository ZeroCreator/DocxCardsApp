// src/app.js

class Storage {
    constructor() {
        this.cards = [];
        this.categories = ['Общее', 'Острые случаи', 'Справочник', 'Глоссарий'];
        this.blockTypes = [
            { id: 'key_characteristic', title: 'Ключевая характеристика', icon: 'fas fa-key' },
            { id: 'description', title: 'Описание', icon: 'fas fa-align-left' },
            { id: 'typical_features', title: 'Типичные особенности', icon: 'fas fa-star' },
            { id: 'clinical_indications', title: 'Клинические показания', icon: 'fas fa-stethoscope' },
            { id: 'etiology', title: 'Этиология', icon: 'fas fa-search' },
            { id: 'remedy_miasms', title: 'Описание миазмов препарата', icon: 'fas fa-dna' },
            { id: 'symptoms', title: 'Симптомы', icon: 'fas fa-heartbeat' },
            { id: 'symptoms_by_system', title: 'Физические симптомы по системам', icon: 'fas fa-lungs' },
            { id: 'application', title: 'Сферы применения', icon: 'fas fa-briefcase-medical' },
            { id: 'modalities', title: 'Модальности', icon: 'fas fa-sliders-h' },
            { id: 'keywords', title: 'Ключи', icon: 'fas fa-key' },
            { id: 'characteristic', title: 'Характеристика', icon: 'fas fa-list' },
            { id: 'differential_diagnosis', title: 'Дифференциальная диагностика', icon: 'fas fa-clipboard-check' },
            { id: 'antidotes', title: 'Взаимосвязи', icon: 'fas fa-link' },
            { id: 'custom_blocks', title: 'Дополнительная информация', icon: 'fas fa-info-circle' },
            { id: 'delusions', title: 'Делюзии', icon: 'fas fa-brain' },
            { id: 'personality', title: 'Тип личности', icon: 'fas fa-user' },
            { id: 'cultural_archetypes', title: 'Культурные архетипы', icon: 'fas fa-monument' },
            { id: 'sources', title: 'Источники', icon: 'fas fa-book' }
        ];
        this.loadCards();
    }

    async loadCards() {
        try {
            const cardsData = localStorage.getItem('docx-cards');
            this.cards = cardsData ? JSON.parse(cardsData) : [];
            console.log(`Загружено ${this.cards.length} карточек`);
        } catch (error) {
            console.warn('Не удалось загрузить карточки:', error);
            this.cards = [];
        }
    }

    async saveCards() {
        try {
            localStorage.setItem('docx-cards', JSON.stringify(this.cards));
            console.log(`Сохранено ${this.cards.length} карточек`);
            return true;
        } catch (error) {
            console.error('Не удалось сохранить карточки:', error);
            return false;
        }
    }

    getCards(filter = '') {
        if (!filter) return this.cards;

        const searchTerm = filter.toLowerCase();
        return this.cards.filter(card =>
            card.title?.toLowerCase().includes(searchTerm) ||
            card.category?.toLowerCase().includes(searchTerm) ||
            card.meta?.cirillic?.toLowerCase().includes(searchTerm) ||
            card.meta?.base_description?.toLowerCase().includes(searchTerm) ||
            JSON.stringify(card.blocks).toLowerCase().includes(searchTerm) ||
            card.meta?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    async addCard(card) {
        try {
            // Генерируем ID для новой карточки
            if (!card.id || card.id.startsWith('new_')) {
                card.id = 'card_' + Date.now();
            }

            card.meta = card.meta || {};
            card.meta.created = card.meta.created || new Date().toISOString();
            card.meta.updated = new Date().toISOString();

            this.cards.unshift(card);
            await this.saveCards();
            return card;
        } catch (error) {
            console.error('Ошибка при добавлении карточки:', error);
            throw error;
        }
    }

    async updateCard(id, updates) {
        try {
            const index = this.cards.findIndex(card => card.id === id);
            if (index !== -1) {
                // Объединяем существующую карточку с обновлениями
                const updatedCard = {
                    ...this.cards[index],
                    ...updates,
                    meta: {
                        ...this.cards[index].meta,
                        ...(updates.meta || {}),
                        updated: new Date().toISOString()
                    }
                };

                // Убедимся, что blocks не перезаписан полностью, если не указан в updates
                if (!updates.blocks) {
                    updatedCard.blocks = this.cards[index].blocks;
                }

                this.cards[index] = updatedCard;
                await this.saveCards();
                return this.cards[index];
            }
            return null;
        } catch (error) {
            console.error('Ошибка при обновлении карточки:', error);
            throw error;
        }
    }

    async deleteCard(id) {
        try {
            const index = this.cards.findIndex(card => card.id === id);
            if (index !== -1) {
                this.cards.splice(index, 1);
                await this.saveCards();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка при удалении карточки:', error);
            throw error;
        }
    }

    getEmptyCard() {
        const blocks = {};
        this.blockTypes.forEach(blockType => {
            blocks[blockType.id] = {
                title: blockType.title,
                content: '',
                enabled: false
            };
        });

        return {
            id: 'new_' + Date.now(),
            title: '',
            category: 'Общее',
            blocks: blocks,
            meta: {
                short_name: '',
                cirillic: '',
                base_description: '',
                slug: '',
                image: '',
                miasm: '',
                group: '',
                author: '',
                source: '',
                tags: [],
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            }
        };
    }

    getBlockTypes() {
        return this.blockTypes;
    }

    getCategories() {
        return this.categories;
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories.push(category);
        }
    }
}

class DocxCardsApp {
    constructor() {
        this.storage = new Storage();
        this.currentCard = null;
        this.currentBlockId = null;
        this.currentView = 'all';
        this.searchQuery = '';
        this.importData = null;
        this.activeFilters = {
            miasms: [],
            groups: []
        };

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadData();
        this.renderCategories();
        this.renderBlocksMenu();
        this.renderFilters();
        this.updateStats();
    }

    cacheElements() {
        // Основные элементы
        this.mainView = document.getElementById('mainView');
        this.detailView = document.getElementById('detailView');
        this.cardsGrid = document.getElementById('cardsGrid');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.newCardBtn = document.getElementById('newCardBtn');
        this.createFirstCardBtn = document.getElementById('createFirstCardBtn');
        this.importFirstCardBtn = document.getElementById('importFirstCardBtn');
        this.cardsCount = document.getElementById('cardsCount');
        this.statsCount = document.getElementById('statsCount');

        // Элементы детального просмотра
        this.backToListBtn = document.getElementById('backToListBtn');
        this.detailCardTitle = document.getElementById('detailCardTitle');
        this.cardMenu = document.getElementById('cardMenu');
        this.cardDetailContent = document.getElementById('cardDetailContent');

        // Модальное окно редактора - ОСНОВНЫЕ ПОЛЯ
        this.editorModal = document.getElementById('editorModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.cardTitle = document.getElementById('cardTitle');
        this.cardCategory = document.getElementById('cardCategory');

        // НОВЫЕ ПОЛЯ
        this.cardShortName = document.getElementById('cardShortName');
        this.cardCirillic = document.getElementById('cardCirillic');
        this.cardBaseDescription = document.getElementById('cardBaseDescription');
        this.cardSlug = document.getElementById('cardSlug');
        this.cardImage = document.getElementById('cardImage');
        this.cardMiasm = document.getElementById('cardMiasm');
        this.cardGroup = document.getElementById('cardGroup');

        // ПОЛЯ ИЗ FOOTER
        this.cardTags = document.getElementById('cardTags');
        this.cardAuthor = document.getElementById('cardAuthor');
        this.cardSource = document.getElementById('cardSource');

        // Блоки редактора
        this.blocksList = document.getElementById('blocksList');
        this.currentBlockTitle = document.getElementById('currentBlockTitle');
        this.blockContent = document.getElementById('blockContent');
        this.blockEnabled = document.getElementById('blockEnabled');
        this.clearBlockBtn = document.getElementById('clearBlockBtn');

        // Preview в редакторе
        this.previewContent = document.getElementById('previewContent');
        this.togglePreviewBtn = document.getElementById('togglePreviewBtn');

        // Кнопки редактора
        this.closeEditorBtn = document.getElementById('closeEditorBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.saveCardBtn = document.getElementById('saveCardBtn');

        // Редактор
        this.editorButtons = document.querySelectorAll('.editor-btn');
        this.addImageBtn = document.getElementById('addImageBtn');

        // Импорт
        this.importModal = document.getElementById('importModal');
        this.fileInput = document.getElementById('fileInput');
        this.browseFileBtn = document.getElementById('browseFileBtn');
        this.dropZone = document.getElementById('dropZone');
        this.closeImportBtn = document.getElementById('closeImportBtn');
    }

    bindEvents() {
        // Навигация в главном представлении
        document.querySelectorAll('.menu-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });

        // Поиск
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }

        // Карточки
        if (this.newCardBtn) {
            this.newCardBtn.addEventListener('click', () => this.openEditor());
        }

        if (this.createFirstCardBtn) {
            this.createFirstCardBtn.addEventListener('click', () => this.openEditor());
        }

        if (this.importFirstCardBtn) {
            this.importFirstCardBtn.addEventListener('click', () => this.openImportModal());
        }

        // Детальный просмотр
        if (this.backToListBtn) {
            this.backToListBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showMainView();
            });
        }

        // Редактор блоков
        if (this.blockContent) {
            this.blockContent.addEventListener('input', () => this.updatePreview());
        }

        if (this.blockEnabled) {
            this.blockEnabled.addEventListener('change', () => this.toggleBlock());
        }

        if (this.clearBlockBtn) {
            this.clearBlockBtn.addEventListener('click', () => this.clearBlock());
        }

        // Кнопки форматирования
        if (this.editorButtons) {
            this.editorButtons.forEach(btn => {
                btn.addEventListener('click', (e) => this.handleEditorCommand(e));
            });
        }

        if (this.addImageBtn) {
            this.addImageBtn.addEventListener('click', () => this.addImage());
        }

        // Сохранение
        if (this.saveCardBtn) {
            this.saveCardBtn.addEventListener('click', (e) => this.handleCardSubmit(e));
        }

        if (this.closeEditorBtn) {
            this.closeEditorBtn.addEventListener('click', () => this.closeEditor());
        }

        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => this.closeEditor());
        }

        if (this.togglePreviewBtn) {
            this.togglePreviewBtn.addEventListener('click', () => this.togglePreview());
        }

        // Импорт
        if (this.browseFileBtn) {
            this.browseFileBtn.addEventListener('click', () => this.fileInput?.click());
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (this.dropZone) {
            this.dropZone.addEventListener('click', () => this.fileInput?.click());
            this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        if (this.closeImportBtn) {
            this.closeImportBtn.addEventListener('click', () => this.closeImportModal());
        }
    }

    async loadData() {
        try {
            await this.storage.loadCards();
            this.renderCards();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    // ==================== ГЛАВНОЕ ПРЕДСТАВЛЕНИЕ ====================
    showMainView() {
        if (this.mainView) this.mainView.style.display = 'flex';
        if (this.detailView) this.detailView.style.display = 'none';
        this.currentCard = null;
        this.renderCards();
    }

    showDetailView() {
        if (this.mainView) this.mainView.style.display = 'none';
        if (this.detailView) this.detailView.style.display = 'flex';
    }

    handleMenuClick(event) {
        const menuItem = event.currentTarget;
        const view = menuItem.dataset.view;

        // Обновляем активный элемент меню
        document.querySelectorAll('.menu-item[data-view]').forEach(item => {
            item.classList.remove('active');
        });
        menuItem.classList.add('active');

        this.currentView = view;
        this.renderCards();
    }

    handleSearch(event) {
        this.searchQuery = event.target.value.trim();
        this.renderCards();

        // Показываем/скрываем кнопку очистки
        if (this.clearSearchBtn) {
            this.clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.searchQuery = '';
        this.renderCards();
        if (this.clearSearchBtn) {
            this.clearSearchBtn.style.display = 'none';
        }
    }

    renderCards() {
        if (!this.cardsGrid) return;

        let cards = this.storage.getCards(this.searchQuery);

        // Фильтрация по виду
        if (this.currentView && this.currentView !== 'all') {
            const category = this.currentView;
            cards = cards.filter(card => card.category === category);
        }

        // Фильтрация по миазмам
        if (this.activeFilters?.miasms?.length > 0) {
            cards = cards.filter(card => {
                if (!card.meta?.miasm) return false;
                const cardMiasms = card.meta.miasm.split(',').map(m => m.trim());
                return this.activeFilters.miasms.some(filterMiasm =>
                    cardMiasms.includes(filterMiasm)
                );
            });
        }

        // Фильтрация по группам
        if (this.activeFilters?.groups?.length > 0) {
            cards = cards.filter(card => {
                if (!card.meta?.group) return false;
                const cardGroups = card.meta.group.split(',').map(g => g.trim());
                return this.activeFilters.groups.some(filterGroup =>
                    cardGroups.includes(filterGroup)
                );
            });
        }

        if (cards.length === 0) {
            this.cardsGrid.style.display = 'none';
            if (this.emptyState) {
                this.emptyState.style.display = 'flex';
            }
        } else {
            this.cardsGrid.style.display = 'grid';
            if (this.emptyState) {
                this.emptyState.style.display = 'none';
            }

            this.cardsGrid.innerHTML = cards.map(card => `
                <div class="card" data-id="${card.id}">
                    <div class="card-header">
                        <h3 class="card-title">${this.escapeHtml(card.title || 'Без названия')}</h3>
                        <span class="card-category">${card.category || 'Общее'}</span>
                    </div>
                    <div class="card-content">
                        ${this.getCardPreview(card)}
                    </div>
                    <div class="card-footer">
                        <span class="card-date">
                            ${new Date(card.meta?.updated || card.meta?.created || Date.now()).toLocaleDateString()}
                        </span>
                        <div class="card-actions">
                            <button class="card-action-btn view-card" title="Просмотреть">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="card-action-btn edit-card" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="card-action-btn export-card" title="Экспорт в .docx">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="card-action-btn delete-card" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Добавляем обработчики событий для карточек
            this.attachCardEvents();
        }

        this.updateStats(cards.length);
    }

    getCardPreview(card) {
        // Пытаемся найти первый заполненный блок для предпросмотра
        const blockTypes = this.storage.getBlockTypes();
        for (const blockType of blockTypes) {
            const block = card.blocks[blockType.id];
            if (block && block.enabled && block.content && block.content.trim()) {
                const text = this.stripHtml(block.content);
                return text.length > 150 ? text.substring(0, 150) + '...' : text;
            }
        }

        // Если нет заполненных блоков, показываем базовое описание
        if (card.meta?.base_description) {
            return card.meta.base_description;
        }

        return 'Нет содержимого';
    }

    attachCardEvents() {
        // Клик по карточке для просмотра
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Открываем просмотр только при клике на основную область карточки
                if (!e.target.closest('.card-action-btn')) {
                    const cardId = card.dataset.id;
                    this.viewCard(cardId);
                }
            });
        });

        // Кнопка просмотра
        document.querySelectorAll('.view-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = btn.closest('.card').dataset.id;
                this.viewCard(cardId);
            });
        });

        // Кнопка редактирования
        document.querySelectorAll('.edit-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = btn.closest('.card').dataset.id;
                this.editCard(cardId);
            });
        });

        // Кнопка экспорта
        document.querySelectorAll('.export-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = btn.closest('.card').dataset.id;
                this.exportCard(cardId);
            });
        });

        // Кнопка удаления
        document.querySelectorAll('.delete-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cardId = btn.closest('.card').dataset.id;
                this.deleteCard(cardId);
            });
        });
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        const categorySelect = document.getElementById('cardCategory');

        const categories = this.storage.getCategories();

        // Рендерим выпадающий список в редакторе
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(category =>
                `<option value="${category}">${category}</option>`
            ).join('');
        }
    }

    renderFilters() {
        this.renderMiasmsFilter();
        this.renderGroupsFilter();
    }

    renderMiasmsFilter() {
        const miasmsFilter = document.getElementById('miasmsFilter');
        if (!miasmsFilter) return;

        // Соберем все уникальные миазмы из всех карточек
        const allMiasms = [];
        this.storage.cards.forEach(card => {
            if (card.meta?.miasm) {
                const miasms = card.meta.miasm.split(',').map(m => m.trim()).filter(m => m);
                miasms.forEach(miasm => {
                    if (!allMiasms.includes(miasm)) {
                        allMiasms.push(miasm);
                    }
                });
            }
        });

        allMiasms.sort();

        if (allMiasms.length === 0) {
            miasmsFilter.innerHTML = '<p class="no-filters">Нет данных</p>';
            return;
        }

        miasmsFilter.innerHTML = allMiasms.map(miasm => `
            <div class="filter-item" data-type="miasm" data-value="${miasm}">
                <span class="filter-checkbox"></span>
                <span>${miasm}</span>
                <span class="filter-count">${this.getMiasmCount(miasm)}</span>
            </div>
        `).join('');

        // Добавим обработчики событий
        this.attachFilterEvents();
    }

    renderGroupsFilter() {
        const groupsFilter = document.getElementById('groupsFilter');
        if (!groupsFilter) return;

        // Соберем все уникальные группы из всех карточек
        const allGroups = [];
        this.storage.cards.forEach(card => {
            if (card.meta?.group) {
                const groups = card.meta.group.split(',').map(g => g.trim()).filter(g => g);
                groups.forEach(group => {
                    if (!allGroups.includes(group)) {
                        allGroups.push(group);
                    }
                });
            }
        });

        allGroups.sort();

        if (allGroups.length === 0) {
            groupsFilter.innerHTML = '<p class="no-filters">Нет данных</p>';
            return;
        }

        groupsFilter.innerHTML = allGroups.map(group => `
            <div class="filter-item" data-type="group" data-value="${group}">
                <span class="filter-checkbox"></span>
                <span>${group}</span>
                <span class="filter-count">${this.getGroupCount(group)}</span>
            </div>
        `).join('');

        // Добавим обработчики событий
        this.attachFilterEvents();
    }

    getMiasmCount(miasm) {
        return this.storage.cards.filter(card => {
            if (!card.meta?.miasm) return false;
            const miasms = card.meta.miasm.split(',').map(m => m.trim());
            return miasms.includes(miasm);
        }).length;
    }

    getGroupCount(group) {
        return this.storage.cards.filter(card => {
            if (!card.meta?.group) return false;
            const groups = card.meta.group.split(',').map(g => g.trim());
            return groups.includes(group);
        }).length;
    }

    attachFilterEvents() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = item.dataset.type;
                const value = item.dataset.value;

                // Переключаем активное состояние
                item.classList.toggle('active');

                // Обновляем фильтры и рендерим карточки
                this.updateActiveFilters();
                this.renderCards();
            });
        });
    }

    updateActiveFilters() {
        this.activeFilters = {
            miasms: [],
            groups: []
        };

        document.querySelectorAll('.filter-item.active').forEach(item => {
            const type = item.dataset.type;
            const value = item.dataset.value;

            if (type === 'miasm') {
                this.activeFilters.miasms.push(value);
            } else if (type === 'group') {
                this.activeFilters.groups.push(value);
            }
        });
    }

    updateStats(count = null) {
        const totalCount = count !== null ? count : this.storage.getCards().length;

        if (this.cardsCount) {
            this.cardsCount.textContent = totalCount;
        }
        if (this.statsCount) {
            this.statsCount.textContent = `${totalCount} карточек`;
        }
    }

    // ==================== ДЕТАЛЬНЫЙ ПРОСМОТР КАРТОЧКИ ====================
    viewCard(cardId) {
        const card = this.storage.getCardById(cardId);
        if (!card) {
            this.showNotification('Карточка не найдена', 'error');
            return;
        }

        this.currentCard = card;
        this.showDetailView();
        this.renderCardDetail();
    }

    renderCardDetail() {
        if (!this.currentCard || !this.detailCardTitle || !this.cardDetailContent) return;

        const card = this.currentCard;
        const blockTypes = this.storage.getBlockTypes();

        // Обновляем заголовок в левом меню
        this.detailCardTitle.textContent = card.title || 'Без названия';

        // Рендерим навигационное меню
        this.renderCardMenu(card, blockTypes);

        // Рендерим содержимое карточки
        this.renderCardContent(card, blockTypes);

        // Настраиваем навигацию
        this.setupCardNavigation();
    }

    renderCardMenu(card, blockTypes) {
        if (!this.cardMenu) return;

        const menuItems = [];

        // Добавляем пункты меню только для включенных и заполненных блоков
        blockTypes.forEach(blockType => {
            const block = card.blocks[blockType.id];
            if (block && block.enabled && block.content && block.content.trim()) {
                menuItems.push(`
                    <li>
                        <a href="#${blockType.id}" class="nav-link">
                            <i class="${blockType.icon}"></i> ${blockType.title}
                        </a>
                    </li>
                `);
            }
        });

        this.cardMenu.innerHTML = menuItems.join('');
    }

    renderCardContent(card, blockTypes) {
        if (!this.cardDetailContent) return;

        let html = `
            <!-- Заголовок карточки -->
            <div class="card-header">
                <h1>${this.escapeHtml(card.title || 'Без названия')}</h1>
                ${card.meta?.short_name ? `<p class="short_name">${this.escapeHtml(card.meta.short_name)}</p>` : ''}
                ${card.meta?.cirillic ? `<p class="cirillic">${this.escapeHtml(card.meta.cirillic)}</p>` : ''}
                ${card.meta?.base_description ? `<p class="base-description">${this.escapeHtml(card.meta.base_description)}</p>` : ''}
            </div>
        `;

        // Если есть изображение
        if (card.meta?.image) {
            html += `
                <div class="card-image-container">
                    <img src="assets/images/${card.meta.image}" alt="${card.title}" class="card-main-image" onerror="this.style.display='none'">
                </div>
            `;
        }

        // Мета-информация
        html += `
            <div class="card-meta-info">
                ${card.meta?.miasm ? `
                    <div class="meta-item">
                        <strong>Миазм:</strong>
                        <span>${this.escapeHtml(card.meta.miasm)}</span>
                    </div>
                ` : ''}

                ${card.meta?.group ? `
                    <div class="meta-item">
                        <strong>Группа:</strong>
                        <span>${this.escapeHtml(card.meta.group)}</span>
                    </div>
                ` : ''}

                ${card.category ? `
                    <div class="meta-item">
                        <strong>Категория:</strong>
                        <span>${this.escapeHtml(card.category)}</span>
                    </div>
                ` : ''}

                ${card.meta?.author ? `
                    <div class="meta-item">
                        <strong>Автор:</strong>
                        <span>${this.escapeHtml(card.meta.author)}</span>
                    </div>
                ` : ''}
            </div>
        `;

        // Добавляем блоки карточки
        blockTypes.forEach(blockType => {
            const block = card.blocks[blockType.id];
            if (block && block.enabled && block.content && block.content.trim()) {
                html += `
                    <section id="${blockType.id}" class="section">
                        <h2>${blockType.title}</h2>
                        <div class="section-content">
                            ${block.content}
                        </div>
                    </section>
                `;
            }
        });

        // Добавляем панель действий
        html += `
            <div class="card-actions-bar">
                <button class="btn btn-primary" onclick="window.app.editCard('${card.id}')">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-secondary" onclick="window.app.exportCard('${card.id}')">
                    <i class="fas fa-download"></i> Экспорт в .docx
                </button>
            </div>
        `;

        this.cardDetailContent.innerHTML = html;
    }

    setupCardNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const menuItems = document.querySelectorAll('.card-menu li');

        // Функция для плавной прокрутки
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Обновляем активную ссылку
                    navLinks.forEach(l => l.classList.remove('active'));
                    menuItems.forEach(item => item.classList.remove('active'));
                    this.classList.add('active');
                    this.parentElement.classList.add('active');
                }
            });
        });

        // Функция для подсветки активного раздела при скролле
        const highlightActiveSection = () => {
            const sections = document.querySelectorAll('.section');
            const scrollPos = window.scrollY + 100;

            let currentActive = null;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    currentActive = sectionId;
                }
            });

            // Обновляем активные ссылки
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + currentActive) {
                    link.classList.add('active');
                    link.parentElement.classList.add('active');
                } else {
                    link.parentElement.classList.remove('active');
                }
            });
        };

        // Слушаем событие скролла
        window.addEventListener('scroll', highlightActiveSection);
        // Вызываем сразу для установки начального состояния
        highlightActiveSection();
    }

    // ==================== РЕДАКТОР КАРТОЧЕК ====================
    renderBlocksMenu() {
        if (!this.blocksList) return;

        const blockTypes = this.storage.getBlockTypes();
        this.blocksList.innerHTML = blockTypes.map(block => `
            <div class="block-item" data-block-id="${block.id}">
                <div class="block-icon">
                    <i class="${block.icon}"></i>
                </div>
                <div class="block-title">${block.title}</div>
                <div class="block-status"></div>
            </div>
        `).join('');

        // Обработчики для блоков
        document.querySelectorAll('.block-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const blockId = e.currentTarget.dataset.blockId;
                this.selectBlock(blockId);
            });
        });
    }

    openEditor(cardId = null) {
        if (cardId) {
            const card = this.storage.getCardById(cardId);
            if (card) {
                this.currentCard = JSON.parse(JSON.stringify(card)); // Глубокое копирование
                this.modalTitle.textContent = 'Редактировать карточку';
            } else {
                this.showNotification('Карточка не найдена', 'error');
                return;
            }
        } else {
            this.currentCard = this.storage.getEmptyCard();
            this.modalTitle.textContent = 'Новая карточка';
        }

        // Заполняем ВСЕ поля
        if (this.cardTitle) this.cardTitle.value = this.currentCard.title || '';
        if (this.cardCategory) this.cardCategory.value = this.currentCard.category || 'Общее';

        // Новые поля
        if (this.cardShortName) this.cardShortName.value = this.currentCard.meta?.short_name || '';
        if (this.cardCirillic) this.cardCirillic.value = this.currentCard.meta?.cirillic || '';
        if (this.cardBaseDescription) this.cardBaseDescription.value = this.currentCard.meta?.base_description || '';
        if (this.cardSlug) this.cardSlug.value = this.currentCard.meta?.slug || '';
        if (this.cardImage) this.cardImage.value = this.currentCard.meta?.image || '';
        if (this.cardMiasm) this.cardMiasm.value = this.currentCard.meta?.miasm || '';
        if (this.cardGroup) this.cardGroup.value = this.currentCard.meta?.group || '';

        // Поля из footer
        if (this.cardTags) this.cardTags.value = this.currentCard.meta?.tags?.join(', ') || '';
        if (this.cardAuthor) this.cardAuthor.value = this.currentCard.meta?.author || '';
        if (this.cardSource) this.cardSource.value = this.currentCard.meta?.source || '';

        // Сбрасываем текущий блок
        this.currentBlockId = null;

        // Обновляем статусы блоков
        this.updateBlocksStatus();

        // Выбираем первый блок
        const blockTypes = this.storage.getBlockTypes();
        if (blockTypes.length > 0) {
            this.selectBlock(blockTypes[0].id);
        }

        if (this.editorModal) {
            this.editorModal.style.display = 'flex';
        }

        setTimeout(() => {
            if (this.cardTitle) this.cardTitle.focus();
        }, 100);
    }

    selectBlock(blockId) {
        // Сохраняем текущий блок перед переключением
        this.saveCurrentBlock();

        this.currentBlockId = blockId;
        const blockTypes = this.storage.getBlockTypes();
        const blockType = blockTypes.find(b => b.id === blockId);

        if (!blockType) return;

        // Обновляем активный блок в меню
        document.querySelectorAll('.block-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.blockId === blockId) {
                item.classList.add('active');
            }
        });

        // Обновляем заголовок
        if (this.currentBlockTitle) {
            this.currentBlockTitle.textContent = blockType.title;
        }

        // Загружаем содержимое блока
        const block = this.currentCard.blocks[blockId] || {
            title: blockType.title,
            content: '',
            enabled: false
        };

        if (this.blockContent) {
            this.blockContent.innerHTML = block.content || '';
            this.blockContent.dataset.blockId = blockId;
        }
        if (this.blockEnabled) {
            this.blockEnabled.checked = block.enabled || false;
        }

        // Обновляем предпросмотр
        this.updatePreview();
    }

    saveCurrentBlock() {
        if (!this.currentBlockId || !this.blockContent || !this.blockEnabled) return;

        const content = this.blockContent.innerHTML;
        const enabled = this.blockEnabled.checked;
        const blockTypes = this.storage.getBlockTypes();
        const blockType = blockTypes.find(b => b.id === this.currentBlockId);

        if (!blockType) return;

        if (!this.currentCard.blocks[this.currentBlockId]) {
            this.currentCard.blocks[this.currentBlockId] = {
                title: blockType.title,
                content: '',
                enabled: false
            };
        }

        this.currentCard.blocks[this.currentBlockId].content = content;
        this.currentCard.blocks[this.currentBlockId].enabled = enabled;

        // Обновляем статус блока в меню
        this.updateBlocksStatus();
    }

    updateBlocksStatus() {
        document.querySelectorAll('.block-item').forEach(item => {
            const blockId = item.dataset.blockId;
            const block = this.currentCard.blocks[blockId];

            if (block && block.content && block.content.trim().length > 0) {
                item.classList.add('has-content');
            } else {
                item.classList.remove('has-content');
            }
        });
    }

    updatePreview() {
        if (!this.currentBlockId || !this.previewContent) return;

        this.saveCurrentBlock();

        // Формируем предпросмотр
        let previewHtml = '';
        const blockTypes = this.storage.getBlockTypes();

        // Показываем только заполненные блоки
        blockTypes.forEach(blockType => {
            const block = this.currentCard.blocks[blockType.id];
            if (block && block.enabled && block.content && block.content.trim().length > 0) {
                previewHtml += `
                    <div class="preview-block">
                        <h3>${blockType.title}</h3>
                        <div class="block-content">
                            ${block.content}
                        </div>
                    </div>
                `;
            }
        });

        this.previewContent.innerHTML = previewHtml || '<p class="text-muted">Нет данных для предпросмотра</p>';
    }

    toggleBlock() {
        if (!this.currentBlockId) return;

        this.saveCurrentBlock();
        this.updatePreview();
    }

    clearBlock() {
        if (!this.currentBlockId) return;

        if (confirm('Очистить содержимое этого блока?')) {
            if (this.blockContent) {
                this.blockContent.innerHTML = '';
            }
            this.saveCurrentBlock();
            this.updatePreview();
        }
    }

    handleEditorCommand(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const command = button.dataset.command;
        const value = button.dataset.value;

        try {
            if (command) {
                if (value) {
                    document.execCommand(command, false, value);
                } else {
                    document.execCommand(command, false, null);
                }
                if (this.blockContent) {
                    this.blockContent.focus();
                }
                this.saveCurrentBlock();
                this.updatePreview();
            }
        } catch (error) {
            console.error('Ошибка выполнения команды редактора:', error);
        }
    }

    addImage() {
        this.showNotification('Функция добавления изображений в разработке', 'info');
    }

    togglePreview() {
        const previewPanel = document.querySelector('.preview-panel');
        if (!previewPanel) return;

        const isHidden = previewPanel.style.display === 'none';

        if (isHidden) {
            previewPanel.style.display = 'flex';
            if (this.togglePreviewBtn) {
                this.togglePreviewBtn.innerHTML = '<i class="fas fa-compress"></i>';
            }
        } else {
            previewPanel.style.display = 'none';
            if (this.togglePreviewBtn) {
                this.togglePreviewBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
    }

    async handleCardSubmit(event) {
        event.preventDefault();

        if (!this.cardTitle || !this.cardCategory) {
            this.showNotification('Заполните обязательные поля', 'error');
            return;
        }

        // Сохраняем текущий блок
        this.saveCurrentBlock();

        // Собираем данные карточки
        const cardData = {
            title: this.cardTitle.value.trim(),
            category: this.cardCategory.value,
            blocks: this.currentCard.blocks,
            meta: {
                // Новые поля
                short_name: this.cardShortName ? this.cardShortName.value.trim() : '',
                cirillic: this.cardCirillic ? this.cardCirillic.value.trim() : '',
                base_description: this.cardBaseDescription ? this.cardBaseDescription.value.trim() : '',
                slug: this.cardSlug ? this.cardSlug.value.trim() : '',
                image: this.cardImage ? this.cardImage.value.trim() : '',
                miasm: this.cardMiasm ? this.cardMiasm.value.trim() : '',
                group: this.cardGroup ? this.cardGroup.value.trim() : '',

                // Существующие поля
                tags: this.cardTags ? this.cardTags.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                author: this.cardAuthor ? this.cardAuthor.value.trim() : '',
                source: this.cardSource ? this.cardSource.value.trim() : '',
                created: this.currentCard.meta?.created || new Date().toISOString(),
                updated: new Date().toISOString()
            }
        };

        if (!cardData.title) {
            this.showNotification('Введите название карточки', 'error');
            return;
        }

        try {
            let savedCard;

            if (this.currentCard.id && this.currentCard.id.startsWith('new_')) {
                // Новая карточка
                savedCard = await this.storage.addCard(cardData);
                this.showNotification('Карточка создана');
            } else if (this.currentCard.id) {
                // Обновление существующей карточки
                savedCard = await this.storage.updateCard(this.currentCard.id, cardData);
                this.showNotification('Карточка обновлена');
            }

            this.closeEditor();

            // Обновляем представление в зависимости от того, где мы находимся
            if (this.detailView && this.detailView.style.display !== 'none') {
                // Мы в детальном просмотре, обновляем его
                this.currentCard = savedCard || cardData;
                this.renderCardDetail();
            } else {
                // Мы в главном представлении
                this.renderCards();
                this.renderCategories();
                this.renderFilters();
            }
        } catch (error) {
            this.showNotification('Ошибка при сохранении карточки', 'error');
            console.error('Save error:', error);
        }
    }

    closeEditor() {
        if (this.editorModal) {
            this.editorModal.style.display = 'none';
        }
        this.currentCard = null;
        this.currentBlockId = null;
    }

    editCard(cardId) {
        this.openEditor(cardId);
    }

    async deleteCard(cardId) {
        if (!confirm('Вы уверены, что хотите удалить эту карточку?')) {
            return;
        }

        try {
            await this.storage.deleteCard(cardId);
            this.showNotification('Карточка удалена');

            // Если мы находимся в детальном просмотре этой карточки, возвращаемся к списку
            if (this.detailView && this.detailView.style.display !== 'none' &&
                this.currentCard && this.currentCard.id === cardId) {
                this.showMainView();
            } else {
                this.renderCards();
                this.renderCategories();
                this.renderFilters();
            }
        } catch (error) {
            this.showNotification('Ошибка при удалении карточки', 'error');
            console.error('Delete error:', error);
        }
    }

    async exportCard(cardId) {
        const card = this.storage.getCardById(cardId);
        if (!card) {
            this.showNotification('Карточка не найдена', 'error');
            return;
        }

        try {
            const defaultName = `${(card.title || 'карточка').replace(/[^\w\s]/gi, '')}.docx`;

            if (!window.electronAPI) {
                this.showNotification('Функция экспорта недоступна в браузере', 'error');
                return;
            }

            const filePath = await window.electronAPI.saveFileDialog(defaultName);

            if (filePath) {
                // Формируем HTML из всех включенных блоков
                let htmlContent = `<h1>${card.title || 'Без названия'}</h1>`;
                htmlContent += `<p><strong>Категория:</strong> ${card.category || 'Общее'}</p>`;

                if (card.meta?.author) {
                    htmlContent += `<p><strong>Автор:</strong> ${card.meta.author}</p>`;
                }

                if (card.meta?.source) {
                    htmlContent += `<p><strong>Источник:</strong> ${card.meta.source}</p>`;
                }

                htmlContent += '<hr>';

                // Добавляем каждый блок
                const blockTypes = this.storage.getBlockTypes();
                blockTypes.forEach(blockType => {
                    const block = card.blocks[blockType.id];
                    if (block && block.enabled && block.content && block.content.trim().length > 0) {
                        htmlContent += `<h2>${blockType.title}</h2>`;
                        htmlContent += block.content;
                        htmlContent += '<hr>';
                    }
                });

                // Экспортируем в .docx
                await window.electronAPI.writeDocx({
                    title: card.title || 'Карточка',
                    content: htmlContent,
                    filePath: filePath
                });

                this.showNotification('Карточка экспортирована в .docx');
            }
        } catch (error) {
            this.showNotification('Ошибка при экспорте', 'error');
            console.error('Export error:', error);
        }
    }

    // ==================== ИМПОРТ ИЗ .DOCX ====================
    openImportModal() {
        if (!this.importModal) return;
        this.importModal.style.display = 'flex';
        if (this.dropZone) {
            this.dropZone.style.display = 'block';
        }
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        this.importData = null;
    }

    closeImportModal() {
        if (!this.importModal) return;
        this.importModal.style.display = 'none';
        this.importData = null;
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.dropZone) {
            this.dropZone.classList.add('dragover');
        }
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.dropZone) {
            this.dropZone.classList.remove('dragover');
        }

        const files = event.dataTransfer.files;
        if (files.length > 0 && this.isDocxFile(files[0])) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && this.isDocxFile(file)) {
            this.processFile(file);
        }
    }

    isDocxFile(file) {
        return file.name.match(/\.(docx|doc)$/i);
    }

    async processFile(file) {
        try {
            if (!window.electronAPI) {
                this.showNotification('Функция импорта недоступна в браузере', 'error');
                return;
            }

            const filePath = file.path || file.name;
            const result = await window.electronAPI.readDocx(filePath);

            // Создаем новую карточку из импортируемого файла
            const title = file.name.replace(/\.docx$/i, '').replace(/\.doc$/i, '');

            const newCard = this.storage.getEmptyCard();
            newCard.title = title;
            newCard.blocks.description = {
                title: 'Описание',
                content: result.html || result.value || '',
                enabled: true
            };

            // Открываем редактор для новой карточки
            this.currentCard = newCard;
            this.openEditor();

            // Закрываем модальное окно импорта
            this.closeImportModal();
        } catch (error) {
            this.showNotification('Ошибка при чтении файла', 'error');
            console.error('Import error:', error);
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 1000;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем стили для анимаций уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 1000;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }

        .notification.success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }

        .notification.error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }

        .notification.info {
            background: #e8f4fd;
            color: #004085;
            border-left: 4px solid #007bff;
        }

        .notification i {
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);

    // Инициализируем приложение
    window.app = new DocxCardsApp();
});
