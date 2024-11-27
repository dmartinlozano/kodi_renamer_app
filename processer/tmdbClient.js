const axios = require('axios');
const BASE_URL = 'https://api.themoviedb.org/3/';

async function searchMovie(title, year, lang, page){
    let url = `${BASE_URL}search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    if (lang) url = `${url}&language=${lang}`;
    if (year) url = `${url}&year=${year}`;
    if (page) url = `${url}&page=${page}`;
    const response = await axios.get(url);
    return response.data;
}

async function languages(){
    const response = await axios.get(`${BASE_URL}configuration/languages?api_key=${process.env.TMDB_API_KEY}`);
    return response.data.sort((a, b) => a.english_name.localeCompare(b.english_name));
}

module.exports = { searchMovie, languages };