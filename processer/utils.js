const path = require('path');
const fs = require('fs').promises;

const extractNameWithoutExtension = (filePath) => path.parse(path.basename(filePath)).name;
const extractExtension = (filePath) => {
    const match = filePath.match(/\.[^/.]+$/);
    return match ? match[0].slice(1) : null;
}
const extractYear = (fileName) => {
    const yearMatch = fileName.match(/\b\d{4}\b/);
    return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

const clearFileName = (fileName) => fileName
        .replace(/(\([^()]*\)|\[[^\[\]]*\])/g, '')
        .replace(/[._]/g, ' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const isFolder = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
}

module.exports = {
    extractNameWithoutExtension,
    extractYear,
    clearFileName,
    extractExtension,
    isFolder
}