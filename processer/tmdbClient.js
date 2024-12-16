require('../configuration.js');
const axios = require('axios');

async function searchMovie(title, year, page){
    const tmdbApiKey = (global.settings && global.settings.customTmdbApiKey) || process.env.TMDB_API_KEY;
    let url = `${process.env.TMDB_BASE_URL}search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&language=${global.settings.lang}`;
    if (year) url = `${url}&year=${year}`;
    if (page) url = `${url}&page=${page}`;
    if (global.settings.includeAdult === 'true') url = `${url}&include_adult=${global.settings.includeAdult}`;
    const response = await axios.get(url);
    return response.data;
}

async function searchTvShow(tvShow, year, page){
    const tmdbApiKey = (global.settings && global.settings.customTmdbApiKey) || process.env.TMDB_API_KEY;
    let url = `${process.env.TMDB_BASE_URL}search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(tvShow)}&language=${global.settings.lang}`;
    if (year) url = `${url}&year=${year}`;
    if (page) url = `${url}&page=${page}`;
    const response = await axios.get(url);
    return response.data;
}

async function languages(){
    const tmdbApiKey = (global.settings && global.settings.customTmdbApiKey) || process.env.TMDB_API_KEY;
    const response = await axios.get(`${process.env.TMDB_BASE_URL}configuration/languages?api_key=${tmdbApiKey}`);
    return response.data.sort((a, b) => a.english_name.localeCompare(b.english_name));
}

module.exports = { searchMovie, searchTvShow, languages };