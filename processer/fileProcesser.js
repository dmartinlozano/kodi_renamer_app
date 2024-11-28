require('dotenv').config();
const { searchMovie, searchTvShow } = require('./tmdbClient.js');
const { State } = require('../dto/file.js');
const {extractNameWithoutExtension, extractYear, clearFileName,extractExtension} = require('./utils.js');
const path = require('path');
const fs = require('fs').promises;

class FileProcesser{

    static async checkFilmsInitialState(films){
        for (let i = 0; i < films.length; i++) {
            if (films[i].state == State.INIT){
                const nameWithoutExtension = extractNameWithoutExtension(films[i].path);
                const extension = extractExtension(films[i].path);
                films[i].suggestedTitle = clearFileName(nameWithoutExtension);
                films[i].suggestedYear = extractYear(nameWithoutExtension);
                try {
                    const response = await searchMovie(
                        films[i].suggestedTitle, 
                        films[i].suggestedYear,
                        1
                    );
                    if (response && response.total_results && response.total_results === 1){
                        const year = response.results[0].release_date.split("-")[0];
                        films[i].id = response.results[0].id;
                        films[i].nameToRename = `${response.results[0].title} (${year}) {tmdb-${response.results[0].id}}.${extension}`;
                        films[i].suggestedTmdbTitles = [];
                    }else if (response && response.total_results && response.total_results !== 0 && films[i].suggestedYear){
                        const filtered = response.results.filter(movie => movie.release_date.startsWith(films[i].suggestedYear));
                        if (filtered.length === 1){
                            films[i].id = filtered[0].id;
                            films[i].nameToRename = `${filtered[0].title} (${year}) {tmdb-${filtered[0].id}}.${extension}`;
                        }
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
    
    static async checkTvShowInitialState(tvShow, lang){
        const year = extractYear(tvShow.path);
        const folderName = path.basename(tvShow.path);
        let folderNameCleaned = clearFileName(folderName);
        try{
            const response = await searchTvShow(folderNameCleaned, year, lang, 1);
            if (response && response.total_results && response.total_results !== 0 && year){
                const filtered = response.results.filter(tvShow => tvShow.first_air_date.startsWith(year));
                if (filtered.length === 1) {
                    tvShow.id = filtered[0].id;
                    tvShow.nameToRename = `${filtered[0].name} (${year})`;
                }
                tvShow.suggestedTmdbTitles = response.results;
            }
            tvShow.suggestedTitle = folderNameCleaned;
            tvShow.state = State.FOUND_DONE;
        } catch (error) {
            console.error(error);
        }
        return tvShow;
    }

    static async getEpisodes(tvShowPath){
        let files = [];
        try {
            const entries = await fs.readdir(tvShowPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(tvShowPath, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = await getEpisodes(fullPath);
                    files = files.concat(subFiles);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(error);
        }
        return files;
    }

    static async rename(film){
        const directory = path.dirname(film.path);
        await fs.rename(film.path, `${directory}/${film.nameToRename}`);
    }
}

module.exports = FileProcesser;