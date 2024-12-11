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

const KodiVideoExtensions = [
    ".3gp", ".avi", ".divx", ".flv", ".h264", ".m2ts", ".m4v", ".mkv", ".mov", 
    ".mp4", ".mpeg", ".mpg", ".mts", ".ogm", ".ogv", ".rm", ".rmvb", ".ts", 
    ".vob", ".webm", ".wmv", ".xvid"
];

const KodiSubtitleExtensions = [
    ".aqt", ".ass", ".dks", ".jss", ".mpl", ".pjs", ".rt", ".smi", ".srt", 
    ".ssa", ".sub", ".txt", ".vtt"
];
  
module.exports = { Movie, TvShow, Episode, State, KodiVideoExtensions, KodiSubtitleExtensions };