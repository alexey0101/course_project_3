function Game(roomName, maxPlayers, quizId, access, host, password) {
    this.roomName = roomName;
    this.players = [];
    this.maxPlayers = maxPlayers;
    this.remainingQuestions = [];
    this.tablescore = [];
    this.quizId = quizId;
    this.access = access;
    this.host = host;
    this.password = password;
    this.playersAnswered = [];
    this.playersRequested = [];
    this.question = '';
    this.questionSend = '';
}

Game.prototype = Object.create(Game);
Game.prototype.constructor = Game;

module.exports = Game;