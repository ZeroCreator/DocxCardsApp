// src/utils/exportHelper.js
export class ExportHelper {
    static generateDocxFromCard(card, blockTypes) {
        // Формируем структурированный документ
        const sections = [];

        // Заголовок
        sections.push({
            type: 'title',
            content: card.title,
            level: 1
        });

        // Мета информация
        sections.push({
            type: 'meta',
            content: `Категория: ${card.category}`,
            level: 2
        });

        // Добавляем каждый блок
        blockTypes.forEach(blockType => {
            const block = card.blocks[blockType.id];
            if (block && block.enabled && block.content && block.content.trim()) {
                sections.push({
                    type: 'block',
                    title: blockType.title,
                    content: block.content,
                    level: 2
                });
            }
        });

        return sections;
    }

    static generateHTML(card, blockTypes) {
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${card.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
                    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    h2 { color: #34495e; margin-top: 30px; }
                    h3 { color: #7f8c8d; }
                    .block { margin-bottom: 20px; }
                    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
        `;

        html += `<h1>${card.title}</h1>`;
        html += `<div class="meta">Категория: ${card.category}</div>`;

        blockTypes.forEach(blockType => {
            const block = card.blocks[blockType.id];
            if (block && block.enabled && block.content) {
                html += `<div class="block">`;
                html += `<h2>${blockType.title}</h2>`;
                html += `<div>${block.content}</div>`;
                html += `</div>`;
            }
        });

        html += `</body></html>`;
        return html;
    }
}