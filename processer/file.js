const State = {
    INIT: 'INIT',
    FOUND_DONE: 'FOUND_DONE',
    COMPLETED: 'COMPLETED'
}
class Media {
    id;
    state = State.INIT;
    nameToRename; //final name to rename
    suggestedTitle; //suggested title
    suggestedYear; //suggested year

    constructor(path) {
      this.path = path;
    }
}

class Movie extends Media{
    suggestedTmdbTitles = [];
}

class TvShow extends Media{
    episodes = []; //list of files paths -tvShow-
    seasons = []; //tmdb sessions data
}
  
module.exports = { Movie, TvShow, State };