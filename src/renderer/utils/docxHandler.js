// src/utils/docxHandler.js
export class DocxHandler {
    static async importFromFile(filePath) {
        try {
            const result = await window.electronAPI.readDocx(filePath);
            return {
                content: result.html,
                messages: result.messages
            };
        } catch (error) {
            throw new Error(`Ошибка импорта: ${error.message}`);
        }
    }

    static async exportToFile(cards, filePath) {
        try {
            // Экспорт одной или нескольких карточек
            const docData = {
                title: cards.length === 1 ? cards[0].title : 'Мои карточки',
                content: cards.map(card =>
                    `<h2>${card.title}</h2><p>Категория: ${card.category}</p>${card.content}`
                ).join('<hr>'),
                filePath: filePath
            };

            await window.electronAPI.writeDocx(docData);
            return true;
        } catch (error) {
            throw new Error(`Ошибка экспорта: ${error.message}`);
        }
    }
}
