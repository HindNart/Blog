const getPagination = (page, totalItems, limit = 9) => {
    const currentPage = Math.max(1, parseInt(page) || 1);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (currentPage - 1) * limit;

    const generatePages = (current, total) => {
        const pages = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push({ num: i, active: i === current });
            }
            return pages;
        }
        pages.push({ num: 1, active: 1 === current });
        if (current > 3) pages.push({ num: '...', ellipsis: true });
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
            pages.push({ num: i, active: i === current });
        }
        if (current < total - 2) pages.push({ num: '...', ellipsis: true });
        pages.push({ num: total, active: total === current });
        return pages;
    };

    return {
        currentPage, totalPages, skip, limit, totalItems,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        nextPage: currentPage + 1,
        prevPage: currentPage - 1,
        pages: generatePages(currentPage, totalPages)
    };
};

module.exports = { getPagination };
