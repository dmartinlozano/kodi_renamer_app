require('dotenv').config();
const { searchMovie } = require('./tmdbClient.js');
const { KRFile, State } = require('./file.js');
const {extractNameWithoutExtension, extractYear, clearFileName,extractExtension} = require('./utils.js');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

class FileProcesser{

    static async checkFilmsInitialState(films, lang){
        for (let i = 0; i < films.length; i++) {
            if (films[i].state == State.INIT){
                const nameWithoutExtension = extractNameWithoutExtension(films[i].path);
                const extension = extractExtension(films[i].path);
                const year = extractYear(nameWithoutExtension);
                let fileName = clearFileName(nameWithoutExtension);
                films[i].suggestedTitle = fileName;
                films[i].suggestedYear = year;
                films[i].uuid = uuidv4();
                try {
                    const response = await searchMovie(fileName, year, lang, 1);
                    if (response && response.total_results && response.total_results !== 0 && year){
                        const filtered = response.results.filter(movie => movie.release_date.startsWith(year));
                        if (filtered.length === 1) films[i].nameToRename = `${filtered[0].title} (${year}) {tmdb-${filtered[0].id}}.${extension}`;
                        films[i].suggestedTmdbTitles = response.results;
                    }
                    films[i].state = State.FOUND_DONE;
                } catch (error) {
                    console.error(error);
                    continue;
                }
            }
        };
        return films;
    }
    
    static processNewTvShows(newShows){
        tvShows = films.concat(Array.from(newShows));
    }

    static async rename(film){
        const directory = path.dirname(film.path);
        await fs.rename(film.path, `${directory}/${film.nameToRename}`);
    }
}

module.exports = FileProcesser;