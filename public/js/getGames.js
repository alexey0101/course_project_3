const funcQ = async function () {

    const gameNameInput = document.querySelector('#game-name-input');
    const searchGameButton = document.querySelector('#search-game');

    const gamesList = document.querySelector('#game-list');
    const gameTemplate = document.querySelector('#game-template').innerHTML;

    searchGameButton.addEventListener('click', async () => {
        var response = await fetch(`${host}/api/games?roomName=${gameNameInput.value}`, {
            method: 'GET',
            headers: {
                Accept: "application/json, text/plain, */*",
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            cache: 'default',
            credentials: "same-origin"
        });

        const games = await response.json();

        const html = Mustache.render(gameTemplate, { games });
        gamesList.innerHTML = html;
    });

};

funcQ();