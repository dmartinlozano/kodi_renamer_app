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

class Episode{
    pathToRename;
    constructor(path, season, episode, patternFound){
        this.path = path;
        this.season = season;
        this.episode = episode;
        this.patternFound = patternFound; //ie: 1x02. To use be replaced by S0102
    }
}

class TvShow extends Media{
    episodes = []; //list of files paths -tvShow-
    seasons = []; //tmdb sessions data
}
  
module.exports = { Movie, TvShow, Episode, State };