#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const { TvShow, Movie } = require('./dto/file.js');
const FileProcesser = require('./processer/fileProcesser.js');
const { searchMovie, searchTvShow } = require('./processer/tmdbClient.js');
const { exists, isFolder, extractNameWithoutExtension, extractExtension, extractFolderPath } = require('./processer/utils.js');

program
    .option('-f, --film <path>', 'Film file path')
    .option('-t, --tvshow <path>', 'TV show directory path')
    .requiredOption('-l, --language <lang>', 'Language code (e.g., es, en)')
    .helpOption('-h, --help', 'Show help')
    .on('--help', () => {
        console.log('\n  Examples:');
        console.log('    $ kodi_renamer --film /a/b/c/film.mp4 -l es');
        console.log('    $ kodi_renamer --tvshow /a/b/c/tvshow -l en');
    });

const options = program.opts();
global.settings = {};

if (process.argv.length <= 2) {
    program.help();
}else{
    program.parse(process.argv);
}

(async () => {

    async function askTitleAndYear() {
        const { title } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'Title to find: ',
            validate(input) {
            if (!input) {
                return 'The title is mandatory';
            }
            return true;
            }
        }
        ]);

        const { year } = await inquirer.prompt([
        {
            type: 'input',
            name: 'year',
            message: 'Year (4 digits):',
            validate(input) {
                if (input && !/^\d{4}$/.test(input)) {
                    return 'Please enter a valid 4-digit year';
                }
                return true;
            }
        }
        ]);
    
        return { title, year };
    }

    global.settings.lang = options.language;
    try {
        if (options.film) {
            if (!exists(options.film)){
                console.log('Film not found');
                return;
            }
            if (isFolder(options.film)){
                console.log('Path is a folder');
                return;
            }
            let movie = new Movie(options.film);
            const initialState = await FileProcesser.checkFilmsInitialState([movie]);
            if (initialState[0].nameToRename){
                movie = initialState[0];
            }else{
                const { title, year } = await askTitleAndYear();
                const resp = await searchMovie(title, year);
                if (resp.results.length === 0){
                    console.log("Film not found");
                    return;
                }
                const choices = resp.results.map(media => ({
                    name: `${media.title} - ${media.overview.substring(0, 100)}...`,
                    value: {
                        id: media.id,
                        title: media.title,
                        year: media.release_date.split('-')[0]
                        }
                }));
                const { media } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'media',
                        message: 'Select a movie:',
                        choices
                    }
                ]);
                const extension = extractExtension(movie.path);
                movie.nameToRename = `${media.title} (${media.year}) {tmdb-${media.id}}.${extension}`;
            }
            const { renameFolder } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'renameFolder',
                    message: `Do you want rename the folder to (${movie.nameToRename})?`,
                    default: false,
                }
            ]);
            
            if (renameFolder){
                FileProcesser.renameFilm(movie);
                console.log("TvShow folder renamed.");
            }

        }

        if (options.tvshow){
            if (!exists(options.tvshow)){
                console.log('tvShow not found');
                return;
            }
            if (!isFolder(options.tvshow)){
                console.log('Path must be a folder');
                return;
            }
            let tvShow = new TvShow(options.tvshow);
            const initialState = await FileProcesser.checkTvShowInitialState(tvShow);
            tvShow = await FileProcesser.getEpisodes(tvShow, tvShow.path);
            if (initialState.nameToRename){
                tvShow = initialState;
            }else{
                const { title, year } = await askTitleAndYear();
                const resp = await searchTvShow(title, year);
                if (resp.results.length === 0){
                    console.log("tvShow not found");
                    return;
                }
                const choices = resp.results.map(media => ({
                    name: `${media.name} - ${media.overview.substring(0, 100)}...`,
                    value: {
                        id: media.id,
                        name: media.name,
                        year: media.first_air_date.split('-')[0]
                        }
                }));
                const { media } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'media',
                        message: 'Select a tvShow:',
                        choices
                    }
                ]);
                tvShow.nameToRename = `${media.name} (${media.year})`;
                promptEpisodes(tvShow);
            }
        }
    } catch (error) {
        console.error('Error to process:', error);
    }


    async function promptEpisodes(tvShow) {
        const episodeChoices = tvShow.episodes.map((episode, index) => ({
          name: `Rename episode (${episode.path})`,
          value: index,
        }));
      
        episodeChoices.push({ name: 'Confirm', value: -1 });
      
        while (true) {
          const { selectedIndex } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedIndex',
              message: 'Select an episode to rename:',
              choices: episodeChoices,
            },
          ]);
      
          if (selectedIndex === -1) {
            const episodesToRename = tvShow.episodes.filter((episode) => episode.pathToRename !== undefined);
            if (episodesToRename.length !== 0) {
                const renameList = episodesToRename
                                    .map((episode) => `- ${episode.path} -> ${episode.pathToRename}`)
                                    .join('\n');
                const { confirmRenameEpisodes } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmRenameEpisodes',
                        message: `Do you confirm renaming these episodes?\n${renameList}`,
                        default: false,
                    },
                    ]);
                if (confirmRenameEpisodes) {
                    FileProcesser.renameEpisodes(tvShow.episodes);
                    console.log("episodes renamed");
                }
            }

            const { renameTvShowFolder } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'renameTvShowFolder',
                message: `Do you want to rename the folder to (${tvShow.nameToRename})?`,
                default: false,
              },
            ]);
      
            if (renameTvShowFolder) {
              FileProcesser.renameTvShowFolder(tvShow);
              console.log('TV show folder renamed.');
            }
            break;
          }
      
          const selectedEpisode = tvShow.episodes[selectedIndex];
          const { season, episode } = await inquirer.prompt([
            {
              type: 'input',
              name: 'season',
              message: 'Enter season:',
              default: selectedEpisode.season || '',
              validate(input) {
                const parsed = parseInt(input, 10);
                return !isNaN(parsed) && parsed > 0 ? true : 'Please enter a valid season number.';
              },
            },
            {
              type: 'input',
              name: 'episode',
              message: 'Enter episode:',
              default: selectedEpisode.episode || '',
              validate(input) {
                const parsed = parseInt(input, 10);
                return !isNaN(parsed) && parsed > 0 ? true : 'Please enter a valid episode number.';
              },
            },
          ]);
          const formattedSeason = season.toString().padStart(2, '0');
          const formattedEpisode = episode.toString().padStart(2, '0');
          const match = selectedEpisode.path.match(new RegExp(selectedEpisode.patternFound));
          if (match && match[0] && match[0].index !== 0) {
            selectedEpisode.pathToRename = selectedEpisode.path.replace(match[0], `S${formattedSeason}E${formattedEpisode}`);
          }else{
            const nameWithoutExtension = extractNameWithoutExtension(selectedEpisode.path);
            const extension = extractExtension(selectedEpisode.path);
            const folder = extractFolderPath(selectedEpisode.path);
            selectedEpisode.pathToRename = `${folder}/${nameWithoutExtension}.S${formattedSeason}E${formattedEpisode}.${extension}`;
          }
        }
      }
      
})();