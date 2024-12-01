const path = require('path');
const fs = require('fs');
const { Episode } = require('../dto/file');
const patterns = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'episodes_template.json'), 'utf8'));

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

const isFolder = (filePath) => {
    try {
        return fs.statSync(filePath).isDirectory();
    } catch (error) {
        return false;
    }
}

function extractSeasonAndEpisode(fileName) {
    for (const { pattern, description } of patterns) {
        const regex = new RegExp(pattern);
        const match = regex.exec(fileName);
        if (match) {
            const groups = match.groups;
            if (groups?.season && groups?.episode) {
                return new Episode(fileName, parseInt(groups.season, 10), parseInt(groups.episode, 10), pattern);
            }
            const numbers = match[0].match(/\d+/g);
            if (numbers) {
                if (numbers.length === 2) {
                    return new Episode(fileName, parseInt(numbers[0], 10), parseInt(numbers[1], 10), pattern);
                } else if (numbers.length === 1) {
                    return new Episode(fileName, Math.floor(numbers[0] / 100), numbers[0] % 100, pattern);
                }
            }
        }
    }
    return new Episode(fileName);
}

module.exports = {
    extractNameWithoutExtension,
    extractYear,
    clearFileName,
    extractExtension,
    isFolder,
    extractSeasonAndEpisode
}