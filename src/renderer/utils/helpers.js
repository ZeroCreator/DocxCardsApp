// src/utils/helpers.js
export const helpers = {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    stripHtmlTags(text) {
        return text.replace(/<[^>]*>/g, '');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
