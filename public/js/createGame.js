const func = async function () {
    const $quizSelector = document.querySelector('#inputGroupQuizName');
    const quizListTemplate = document.querySelector('#quiz-pack-names').innerHTML;

    var response = await fetch(`${host}/api/users/quizzes`, {
        method: 'GET',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        credentials: "same-origin"
    });

    const quizzes = await response.json();

    const html = Mustache.render(quizListTemplate, { quizzes });
    $quizSelector.innerHTML = html;

    const $createGameButton = document.querySelector('#create-game-button');

    document.querySelector('#inputGroupSelectAccess').addEventListener('change', (event) => {
        if (event.target.value === 'Private') {
            document.querySelector('#room-password-block').classList.remove('d-none');
        } else {
            document.querySelector('#room-password-block').classList.add('d-none');
        }
    });

    $createGameButton.addEventListener('click', async () => {
        const roomName = document.querySelector('#room-name').value;
        const maxPlayers = document.querySelector('#max-players').value;
        const quizId = document.querySelector('#inputGroupQuizName').value;
        const access = document.querySelector('#inputGroupSelectAccess').value;
        const password = document.querySelector('#room-password').value;

        response = await fetch(`${host}/api/games`, {
            method: 'POST',
            headers: {
                Accept: "application/json, text/plain, */*",
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            cache: 'default',
            credentials: "same-origin",
            body: JSON.stringify({
                roomName,
                maxPlayers,
                quizId,
                access,
                password
            })
        });

        const responseJSON = await response.json();
        console.log(responseJSON);

        if (response.status === 200) {
            document.location = `/games/${roomName}`;
        } else {
            alert(responseJSON.error);
        }

    });
};

func();