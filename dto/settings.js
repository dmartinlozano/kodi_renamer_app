class Settings{
    constructor(lang, includeAdult, customTmdbApiKey) {
        this.lang = lang;
        this.includeAdult = includeAdult;
        this.customTmdbApiKey = customTmdbApiKey;
    }
}
module.exports= { Settings };