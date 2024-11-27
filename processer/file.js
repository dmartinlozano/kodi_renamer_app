const Type = {
    FILMS: 'FILMS',
    TV_SHOW: 'TV_SHOW'
}
const State = {
    INIT: 'INIT',
    FOUND_DONE: 'FOUND_DONE',
    COMPLETED: 'COMPLETED'
}
class KRFile {
    uuid;
    state = State.INIT;
    nameToRename; //final name to rename
    suggestedTmdbTitles = []; //titles found in tmdb
    suggestedTitle; //suggested title
    suggestedYear; //suggested year
    constructor(path, type) {
      this.path = path;
      this.type = type;
    }
}
  
module.exports = { Type, State, KRFile };