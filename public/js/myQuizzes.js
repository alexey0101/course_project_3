const func = async function () {

    const quizzesList = document.querySelector('#quiz-list');
    const quizBlockTemplate = document.querySelector('#quiz-pack-template').innerHTML;

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

    const html = Mustache.render(quizBlockTemplate, { quizzes });
    quizzesList.innerHTML = html;

    quizzesList.addEventListener('click', async (event) => {
        if (event.target && 'BUTTON' === event.target.tagName) {
            var response = await fetch(`${host}/api/quiz/delete`, {
                method: 'DELETE',
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
                alert('Викторина была успешно удалена!');

                event.target.parentNode.parentNode.parentNode.remove();
            } else {
                alert('Ошибка при удалении викторины!');
            }
        }
    });
};

func();