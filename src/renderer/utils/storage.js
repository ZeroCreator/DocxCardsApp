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
            // Временная загрузка из localStorage для демо
            const cardsData = localStorage.getItem('docx-cards');
            this.cards = cardsData ? JSON.parse(cardsData) : [];
        } catch (error) {
            console.warn('Не удалось загрузить карточки:', error);
            this.cards = [];
        }
    }

    async saveCards() {
        try {
            localStorage.setItem('docx-cards', JSON.stringify(this.cards));
        } catch (error) {
            console.error('Не удалось сохранить карточки:', error);
        }
    }

    getBlockTypes() {
        return this.blockTypes;
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
            id: Date.now().toString(),
            title: '',
            category: 'Общее',
            blocks: blocks,
            meta: {
                author: '',
                source: '',
                tags: [],
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            }
        };
    }

    getCards(filter = '') {
        if (!filter) return this.cards;
        return this.cards.filter(card =>
            card.title.toLowerCase().includes(filter.toLowerCase()) ||
            card.content.toLowerCase().includes(filter.toLowerCase()) ||
            card.category.toLowerCase().includes(filter.toLowerCase())
        );
    }

    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }

    async addCard(card) {
        const newCard = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...card
        };

        this.cards.unshift(newCard);
        await this.saveCards();
        return newCard;
    }

    async updateCard(id, updates) {
        const index = this.cards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.cards[index] = {
                ...this.cards[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.saveCards();
            return this.cards[index];
        }
        return null;
    }

    async deleteCard(id) {
        const index = this.cards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.cards.splice(index, 1);
            await this.saveCards();
            return true;
        }
        return false;
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

export default Storage;
