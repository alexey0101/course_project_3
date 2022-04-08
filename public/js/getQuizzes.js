const func = async function () {

    const quizNameInput = document.querySelector('#quiz-name-input');
    const searchQuizButton = document.querySelector('#search-quiz-button');

    const quizzesList = document.querySelector('#quiz-list');
    const quizBlockTemplate = document.querySelector('#quiz-pack-template').innerHTML;

    searchQuizButton.addEventListener('click', async () => {
        var response = await fetch(`${host}/api/quiz/getAll?name=${quizNameInput.value}`, {
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

        const html = Mustache.render(quizBlockTemplate, { quizzes });
        quizzesList.innerHTML = html;
    });

    quizzesList.addEventListener('click', async (event) => {
        if (event.target && 'BUTTON' === event.target.tagName) {
            var response = await fetch(`${host}/api/quiz/add`, {
                method: 'POST',
                headers: {
                    Accept: "application/json, text/plain, */*",
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                cache: 'default',
                credentials: "same-origin",
                body: JSON.stringify({
                    quiz: event.target.parentNode.parentNode.id
                })
            });

            if (response.status === 200) {
               alert('Викторина была успешно добавлена!'); 
            } else {
                alert('Викторина уже добавлена!');
            }
        }
    }
)};

func();