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
            JSON.stringify(card.blocks).toLowerCase().includes(searchTerm) ||
            card.meta?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    async addCard(card) {
        try {
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
                this.cards[index] = {
                    ...this.cards[index],
                    ...updates,
                    meta: {
                        ...this.cards[index].meta,
                        ...updates.meta,
                        updated: new Date().toISOString()
                    }
                };
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
                cirillic: '',
                base_description: '',
                short_name: '',
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

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadData();
        this.renderCategories();
        this.renderBlocksMenu();
        this.updateStats();
        this.showMainView();
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

        // Модальное окно редактора
        this.editorModal = document.getElementById('editorModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.cardTitle = document.getElementById('cardTitle');
        this.cardCategory = document.getElementById('cardCategory');
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
        this.importPreview = document.getElementById('importPreview');
        this.importPreviewContent = document.getElementById('previewContent');
        this.confirmImportBtn = document.getElementById('confirmImportBtn');
        this.cancelImportBtn = document.getElementById('cancelImportBtn');
        this.closeImportBtn = document.getElementById('closeImportBtn');
    }

    bindEvents() {
        // Навигация в главном представлении
        document.querySelectorAll('.menu-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });

        // Поиск
        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn?.addEventListener('click', () => this.clearSearch());

        // Карточки
        this.newCardBtn?.addEventListener('click', () => this.openEditor());
        this.createFirstCardBtn?.addEventListener('click', () => this.openEditor());
        this.importFirstCardBtn?.addEventListener('click', () => this.openImportModal());

        // Детальный просмотр
        this.backToListBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showMainView();
        });

        // Редактор блоков
        this.blockContent?.addEventListener('input', () => this.updatePreview());
        this.blockContent?.addEventListener('blur', () => this.updatePreview());
        this.blockEnabled?.addEventListener('change', () => this.toggleBlock());
        this.clearBlockBtn?.addEventListener('click', () => this.clearBlock());

        // Кнопки форматирования
        this.editorButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEditorCommand(e));
        });

        this.addImageBtn?.addEventListener('click', () => this.addImage());

        // Сохранение
        this.saveCardBtn?.addEventListener('click', (e) => this.handleCardSubmit(e));
        this.closeEditorBtn?.addEventListener('click', () => this.closeEditor());
        this.cancelEditBtn?.addEventListener('click', () => this.closeEditor());
        this.togglePreviewBtn?.addEventListener('click', () => this.togglePreview());

        // Импорт
        this.browseFileBtn?.addEventListener('click', () => this.fileInput?.click());
        this.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
        this.dropZone?.addEventListener('click', () => this.fileInput?.click());
        this.dropZone?.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone?.addEventListener('drop', (e) => this.handleDrop(e));
        this.closeImportBtn?.addEventListener('click', () => this.closeImportModal());
        this.cancelImportBtn?.addEventListener('click', () => this.closeImportModal());
        this.confirmImportBtn?.addEventListener('click', () => this.confirmImport());
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

        if (cards.length === 0) {
            if (this.cardsGrid) this.cardsGrid.style.display = 'none';
            if (this.emptyState) {
                this.emptyState.style.display = 'flex';
            }
        } else {
            if (this.cardsGrid) this.cardsGrid.style.display = 'grid';
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
        return 'Нет содержимого';
    }

    attachCardEvents() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Открываем просмотр только при клике на основную область карточки
                if (!e.target.closest('.card-action-btn')) {
                    this.viewCard(card.dataset.id);
                }
            });
        });

        document.querySelectorAll('.view-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewCard(btn.closest('.card').dataset.id);
            });
        });

        document.querySelectorAll('.edit-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editCard(btn.closest('.card').dataset.id);
            });
        });

        document.querySelectorAll('.export-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exportCard(btn.closest('.card').dataset.id);
            });
        });

        document.querySelectorAll('.delete-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCard(btn.closest('.card').dataset.id);
            });
        });
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        const categorySelect = document.getElementById('cardCategory');

        const categories = this.storage.getCategories();

        // Рендерим список категорий в сайдбаре
        if (categoriesList) {
            categoriesList.innerHTML = categories.map(category => `
                <div class="category-item" data-category="${category}">
                    <i class="fas fa-folder"></i>
                    <span>${category}</span>
                    <span class="badge">
                        ${this.storage.getCards().filter(c => c.category === category).length}
                    </span>
                </div>
            `).join('');

            // Добавляем обработчики для категорий
            document.querySelectorAll('.category-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const category = item.dataset.category;

                    // Обновляем активные элементы
                    document.querySelectorAll('.menu-item[data-view], .category-item').forEach(el => {
                        el.classList.remove('active');
                    });
                    item.classList.add('active');

                    this.currentView = category;
                    this.renderCards();
                });
            });
        }

        // Рендерим выпадающий список в редакторе
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(category =>
                `<option value="${category}">${category}</option>`
            ).join('');
        }
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
        this.setupCardNavigation();
    }

    renderCardDetail() {
        if (!this.currentCard) return;

        const card = this.currentCard;
        const blockTypes = this.storage.getBlockTypes();

        // Обновляем заголовок в левом меню
        if (this.detailCardTitle) {
            this.detailCardTitle.textContent = card.title || 'Без названия';
        }

        // Рендерим навигационное меню
        this.renderCardMenu(card, blockTypes);

        // Рендерим содержимое карточки
        this.renderCardContent(card, blockTypes);
    }

    renderCardMenu(card, blockTypes) {
        if (!this.cardMenu) return;

        const menuItems = [];

        // Сначала добавляем основные мета-данные
        menuItems.push(`
            <li>
                <a href="#card-header" class="nav-link">
                    <i class="fas fa-info-circle"></i> Основная информация
                </a>
            </li>
        `);

        // Порядок отображения такой же
        const displayOrder = [
            'key_characteristic',
            'description',
            'typical_features',
            'clinical_indications',
            'etiology',
            'remedy_miasms',
            'symptoms',
            'symptoms_by_system',
            'application',
            'modalities',
            'keywords',
            'images_block',
            'characteristic',
            'differential_diagnosis',
            'antidotes',
            'custom_blocks',
            'delusions',
            'personality',
            'cultural_archetypes',
            'sources'
        ];

        // Добавляем ВСЕ блоки из displayOrder, которые есть в карточке
        displayOrder.forEach(blockId => {
            const blockType = blockTypes.find(b => b.id === blockId);
            if (!blockType) return;

            const block = card.blocks[blockId];
            if (block) {
                const hasContent = block.content && block.content.trim();

                // Показываем в меню если блок включен ИЛИ имеет содержимое
                if (block.enabled || hasContent) {
                    menuItems.push(`
                        <li>
                            <a href="#${blockId}" class="nav-link">
                                <i class="${blockType.icon || 'fas fa-cube'}"></i>
                                ${blockType.title}
                                ${!hasContent ? '<span class="empty-badge">(пусто)</span>' : ''}
                            </a>
                        </li>
                    `);
                }
            }
        });

        this.cardMenu.innerHTML = menuItems.join('');
    }

    renderCardContent(card, blockTypes) {
        if (!this.cardDetailContent) return;

        let html = `
            <!-- Заголовок карточки - ТОЧНО КАК В ОРИГИНАЛЕ -->
            <div class="card-header">
                <h1>${this.escapeHtml(card.title || 'Без названия')}</h1>
                ${card.meta?.short_name ? `<p class="short_name">${this.escapeHtml(card.meta.short_name)}</p>` : ''}
                ${card.meta?.cirillic ? `<p class="cirillic">${this.escapeHtml(card.meta.cirillic)}</p>` : ''}
                ${card.meta?.base_description ? `<p class="cirillic base-description">${this.escapeHtml(card.meta.base_description)}</p>` : ''}
            </div>
        `;

        // Если есть изображение, добавляем его
        if (card.meta?.image) {
            html += `
                <div class="section-image-wrapper">
                    <img src="${card.meta.image}" alt="${card.title}" class="card-main-image">
                </div>
            `;
        }

        // Мета-информация в виде таблицы (как в оригинале)
        html += `
            <div class="meta-grid">
                ${card.meta?.miasm ? `
                    <div class="meta-field">
                        <label>Миазм:</label>
                        <span class="meta-value">${this.escapeHtml(card.meta.miasm)}</span>
                    </div>
                ` : ''}

                ${card.category ? `
                    <div class="meta-field">
                        <label>Категория:</label>
                        <span class="meta-value">${this.escapeHtml(card.category)}</span>
                    </div>
                ` : ''}

                ${card.meta?.author ? `
                    <div class="meta-field">
                        <label>Автор:</label>
                        <span class="meta-value">${this.escapeHtml(card.meta.author)}</span>
                    </div>
                ` : ''}

                ${card.meta?.source ? `
                    <div class="meta-field">
                        <label>Источник:</label>
                        <span class="meta-value">${this.escapeHtml(card.meta.source)}</span>
                    </div>
                ` : ''}

                ${card.meta?.tags && card.meta.tags.length > 0 ? `
                    <div class="meta-field">
                        <label>Теги:</label>
                        <span class="meta-value">
                            ${card.meta.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;

        // ВСЕ БЛОКИ - включаем даже если они пустые или не включены
        // Сначала определим порядок отображения блоков
        const displayOrder = [
            'key_characteristic',
            'description',
            'typical_features',
            'clinical_indications',
            'etiology',
            'remedy_miasms',
            'symptoms',
            'symptoms_by_system',
            'application',
            'modalities',
            'keywords',
            'images_block',
            'characteristic',
            'differential_diagnosis',
            'antidotes',
            'custom_blocks',
            'delusions',
            'personality',
            'cultural_archetypes',
            'sources'
        ];

        // Отображаем блоки в порядке displayOrder
        displayOrder.forEach(blockId => {
            const blockType = blockTypes.find(b => b.id === blockId);
            if (!blockType) return;

            const block = card.blocks[blockId];
            if (block) {
                const hasContent = block.content && block.content.trim();

                // Показываем блок только если он включен или имеет содержимое
                if (block.enabled || hasContent) {
                    html += `
                        <section id="${blockId}" class="section">
                            <h2>${blockType.title}</h2>
                            <div class="section-content">
                                ${hasContent ? this.formatBlockContent(block.content, blockId) : '<div class="empty-content">Нет содержимого</div>'}
                            </div>
                        </section>
                    `;
                }
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

    formatBlockContent(content, blockId) {
        if (!content) return '';

        let formatted = content;

        // Для specific_blocks делаем список в две колонки
        if (blockId === 'typical_features' || blockId === 'symptoms' || blockId === 'keywords') {
            // Проверяем, содержит ли контент списки
            if (content.includes('<li>') || content.includes('<ul>')) {
                // Добавляем класс для двухколоночного списка
                formatted = formatted.replace('<ul>', '<ul class="section-list">');
                formatted = formatted.replace('<ol>', '<ol class="section-list">');
            } else {
                // Если нет списков, пытаемся создать из простого текста
                const lines = content.split('\n').filter(line => line.trim());
                if (lines.length > 1) {
                    formatted = '<ul class="section-list">' +
                        lines.map(line => `<li>${line}</li>`).join('') +
                        '</ul>';
                }
            }
        }

        // Для изображений
        if (blockId === 'images_block' || blockId === 'personality_images') {
            const imgTags = content.match(/<img[^>]+>/g);
            if (imgTags && imgTags.length > 0) {
                formatted = '<div class="images-grid">';
                imgTags.forEach(imgTag => {
                    formatted += `
                        <div class="image-item">
                            <div class="image-container">
                                ${imgTag}
                            </div>
                        </div>
                    `;
                });
                formatted += '</div>';
            }
        }

        return formatted;
    }

    setupCardNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const menuItems = document.querySelectorAll('.card-menu li');

        // Функция для плавной прокрутки
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                let targetElement;

                if (targetId === '#card-header') {
                    targetElement = document.querySelector('.card-header');
                } else {
                    targetElement = document.querySelector(targetId);
                }

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
            const header = document.querySelector('.card-header');
            const scrollPos = window.scrollY + 100;

            let currentActive = 'card-header';

            // Проверяем заголовок
            if (header) {
                const headerTop = header.offsetTop;
                const headerHeight = header.offsetHeight;
                if (scrollPos >= headerTop && scrollPos < headerTop + headerHeight) {
                    currentActive = 'card-header';
                }
            }

            // Проверяем все секции
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
                const linkTarget = link.getAttribute('href').substring(1);
                if (linkTarget === currentActive) {
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
        this.currentCard = cardId ? this.storage.getCardById(cardId) : this.storage.getEmptyCard();

        if (cardId && this.currentCard) {
            this.modalTitle.textContent = 'Редактировать карточку';
        } else {
            this.modalTitle.textContent = 'Новая карточка';
            this.currentCard = this.storage.getEmptyCard();
        }

        // Заполняем основные поля
        if (this.cardTitle) this.cardTitle.value = this.currentCard.title || '';
        if (this.cardCategory) this.cardCategory.value = this.currentCard.category || 'Общее';
        if (this.cardTags) this.cardTags.value = this.currentCard.meta?.tags?.join(', ') || '';
        if (this.cardAuthor) this.cardAuthor.value = this.currentCard.meta?.author || '';
        if (this.cardSource) this.cardSource.value = this.currentCard.meta?.source || '';

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

        const content = this.blockContent ? this.blockContent.innerHTML : '';
        const blockTypes = this.storage.getBlockTypes();
        const blockType = blockTypes.find(b => b.id === this.currentBlockId);

        if (!blockType) return;

        // Сохраняем содержимое в текущую карточку
        if (!this.currentCard.blocks[this.currentBlockId]) {
            this.currentCard.blocks[this.currentBlockId] = {
                title: blockType.title,
                content: '',
                enabled: true
            };
        }

        this.currentCard.blocks[this.currentBlockId].content = content;

        // Обновляем статус
        this.updateBlocksStatus();

        // Формируем предпросмотр
        let previewHtml = '';

        // Показываем только заполненные блоки
        const blockTypesArray = this.storage.getBlockTypes();
        Object.entries(this.currentCard.blocks).forEach(([blockId, block]) => {
            if (block.enabled && block.content && block.content.trim().length > 0) {
                const blockType = blockTypesArray.find(b => b.id === blockId);
                if (blockType) {
                    previewHtml += `
                        <div class="preview-block">
                            <h3>${blockType.title}</h3>
                            <div class="block-content">
                                ${block.content}
                            </div>
                        </div>
                    `;
                }
            }
        });

        this.previewContent.innerHTML = previewHtml || '<p class="text-muted">Нет данных для предпросмотра</p>';
    }

    toggleBlock() {
        if (!this.currentBlockId) return;

        const enabled = this.blockEnabled ? this.blockEnabled.checked : false;
        const blockTypes = this.storage.getBlockTypes();
        const blockType = blockTypes.find(b => b.id === this.currentBlockId);

        if (!blockType) return;

        if (!this.currentCard.blocks[this.currentBlockId]) {
            this.currentCard.blocks[this.currentBlockId] = {
                title: blockType.title,
                content: '',
                enabled: enabled
            };
        } else {
            this.currentCard.blocks[this.currentBlockId].enabled = enabled;
        }

        this.updatePreview();
    }

    clearBlock() {
        if (!this.currentBlockId) return;

        if (confirm('Очистить содержимое этого блока?')) {
            if (this.blockContent) {
                this.blockContent.innerHTML = '';
            }
            if (this.currentCard.blocks[this.currentBlockId]) {
                this.currentCard.blocks[this.currentBlockId].content = '';
            }
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

        if (!this.cardTitle || !this.cardCategory) return;

        // Собираем данные карточки
        const cardData = {
            title: this.cardTitle.value.trim(),
            category: this.cardCategory.value,
            blocks: { ...this.currentCard.blocks },
            meta: {
                cirillic: this.currentCard.meta?.cirillic || '',
                base_description: this.currentCard.meta?.base_description || '',
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
            if (this.currentCard.id && this.currentCard.id.startsWith('new_')) {
                // Новая карточка
                cardData.id = Date.now().toString();
                await this.storage.addCard(cardData);
                this.showNotification('Карточка создана');
            } else if (this.currentCard.id) {
                // Обновление существующей карточки
                await this.storage.updateCard(this.currentCard.id, cardData);
                this.showNotification('Карточка обновлена');
            }

            this.closeEditor();

            // Обновляем представление в зависимости от того, где мы находимся
            if (this.detailView && this.detailView.style.display !== 'none') {
                // Мы в детальном просмотре, обновляем его
                this.currentCard = cardData;
                this.renderCardDetail();
            } else {
                // Мы в главном представлении
                this.renderCards();
                this.renderCategories();
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
        if (this.importPreview) {
            this.importPreview.style.display = 'none';
        }
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

            if (this.importPreviewContent) {
                this.importPreviewContent.innerHTML = result.html || result.value || 'Не удалось прочитать содержимое файла';
            }

            if (this.dropZone) {
                this.dropZone.style.display = 'none';
            }
            if (this.importPreview) {
                this.importPreview.style.display = 'block';
            }

            // Сохраняем данные для импорта
            this.importData = {
                content: result.html || result.value || '',
                fileName: file.name
            };
        } catch (error) {
            this.showNotification('Ошибка при чтении файла', 'error');
            console.error('Import error:', error);
        }
    }

    async confirmImport() {
        if (!this.importData) return;

        try {
            const title = this.importData.fileName.replace(/\.docx$/i, '').replace(/\.doc$/i, '');

            const newCard = this.storage.getEmptyCard();
            newCard.title = title;
            newCard.blocks.description = {
                title: 'Описание',
                content: this.importData.content,
                enabled: true
            };

            await this.storage.addCard(newCard);

            this.showNotification('Карточка импортирована');
            this.closeImportModal();
            this.renderCards();
            this.renderCategories();
        } catch (error) {
            this.showNotification('Ошибка при импорте', 'error');
            console.error('Import save error:', error);
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
    showNotification(message, type = 'success') {
        let notification = document.getElementById('successNotification');
        let messageEl = document.getElementById('notificationMessage');

        if (!notification || !messageEl) {
            // Создаем уведомление если его нет
            notification = document.createElement('div');
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
            return;
        }

        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
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

    // Для отладки: глобальная функция для открытия DevTools
    window.openDevTools = () => {
        if (window.electronAPI && window.electronAPI.openDevTools) {
            window.electronAPI.openDevTools();
        }
    };
});
