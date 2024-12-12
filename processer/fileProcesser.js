const { searchMovie, searchTvShow } = require('./tmdbClient.js');
const { State, KodiVideoExtensions, KodiSubtitleExtensions } = require('../dto/file.js');
const { extractNameWithoutExtension, 
        extractYear, 
        clearFileName,
        extractExtension, 
        extractSeasonAndEpisode } = require('./utils.js');
const path = require('path');
const fs = require('fs');

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
                } catch (e) {
                    global.win.webContents.send('errorNotification:show', e.message);
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
        } catch (e) {
            global.win.webContents.send('errorNotification:show', e.message);
        }
        return tvShow;
    }

    static async getEpisodes(tvShow, fullPath) {
        try {
            const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
            await Promise.all(entries.map(async (entry) => {
                const entryFullPath = path.join(fullPath, entry.name);
                if (entry.isDirectory()) {
                    await this.getEpisodes(tvShow, entryFullPath);
                } else if (entry.isFile()) {
                    const fileExtension = path.extname(entry.name).toLowerCase();
                    if (KodiVideoExtensions.includes(fileExtension)) {
                        tvShow.episodes.push(extractSeasonAndEpisode(entryFullPath));
                    }
                }
            }));
        } catch (e) {
            global.win.webContents.send('errorNotification:show', e.message);
        }
        return tvShow;
    }

    static renameFilm(film){
        try{
            //rename file
            const originalPath = film.path;
            const newPath = `${path.dirname(film.path)}/${film.nameToRename}`;
            fs.renameSync(originalPath, newPath);

            //rename subtitle if exists
            const originalBaseName = path.basename(originalPath, path.extname(originalPath));
            const newBaseName = path.basename(newPath, path.extname(newPath));

            KodiSubtitleExtensions.forEach(extension => {
                const subtitlePath = `${path.dirname(originalPath)}/${originalBaseName}${extension}`;
                const newSubtitlePath = `${path.dirname(newPath)}/${newBaseName}${extension}`;
                if (fs.existsSync(subtitlePath)) fs.renameSync(subtitlePath, newSubtitlePath);
            });

        }catch(e){
            global.win.webContents.send('errorNotification:show', e.message);
        }
    }

    static renameEpisodes(episodes){
        episodes.forEach((episode)=>{
            if (episode.pathToRename){
                try{
                    // Rename episode
                    const originalPath = episode.path;
                    const newPath = episode.pathToRename;
                    fs.renameSync(originalPath, newPath);

                    // Renombrar subtitle if exists
                    const originalBaseName = path.basename(originalPath, path.extname(originalPath));
                    const newBaseName = path.basename(newPath, path.extname(newPath));

                    KodiSubtitleExtensions.forEach(extension => {
                        const subtitlePath = `${path.dirname(originalPath)}/${originalBaseName}${extension}`;
                        const newSubtitlePath = `${path.dirname(newPath)}/${newBaseName}${extension}`;
                        if (fs.existsSync(subtitlePath)) {
                            fs.renameSync(subtitlePath, newSubtitlePath);
                        }
                    });
                }catch(e){
                    global.win.webContents.send('errorNotification:show', e.message);
                }
            }
        })
    }
}

module.exports = FileProcesser;