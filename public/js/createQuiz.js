const questionTemplate = document.querySelector('#question-template').innerHTML;

const addQuestionButton = document.querySelector('#add-question-button');
const createQuizButton = document.querySelector('#create-quiz-button');

const questionSection = document.querySelector('.questions');

const quizNameInput = document.querySelector('#quiz-name');

quizNameInput.addEventListener('click', async () => {
    quizNameInput.style.border = '';
    quizNameInput.style.borderColor = '';
});

addQuestionButton.addEventListener('click', async () => {
    const html = Mustache.render(questionTemplate);
    questionSection.insertAdjacentHTML('beforeend', html);
});

questionSection.addEventListener('click', async (event) => {
    if (event.target && 'delete-question-button' === event.target.id) {
        event.target.parentNode.parentNode.parentNode.parentNode.remove();
    }

    if (event.target && 'INPUT' === event.target.tagName) {
        event.target.style.border = '';
        event.target.style.borderColor = '';
    }
});

createQuizButton.addEventListener('click', async () => {
    const inputFields = document.querySelectorAll('input');

    var status = 1;
    inputFields.forEach(field => {
        if (field.value.length === 0 || (field.min && field.value < 0)) {
            field.style.border = '1px solid';
            field.style.borderColor = 'red';
            status = 0;
        }
    });

    if (quizNameInput.value.length === 0) {
        quizNameInput.style.border = '1px solid';
        quizNameInput.style.borderColor = 'red';
        status = 0;
    }

    if (status === 1) {
        const quizName = document.querySelector('#quiz-name').value;
        const access = document.querySelector('#inputGroupSelectAccess').value;

        const questions = document.querySelectorAll('.quiz-block');

        const questionsArray = [];

        questions.forEach(question => {
            const questionText = question.querySelector('input[name="question-text"]').value;
            const questionTheme = question.querySelector('input[name="question-theme"]').value;
            const questionCost = question.querySelector('input[name="question-cost"]').value;
            const firstOption = question.querySelector('input[name="question-option-1"]').value;
            const secondOption = question.querySelector('input[name="question-option-2"]').value;
            const thirdOption = question.querySelector('input[name="question-option-3"]').value;
            const fourthOption = question.querySelector('input[name="question-option-4"]').value;
            const correctAnswer = question.querySelector('#correctOption').value;

            questionsArray.push({
                description: questionText,
                theme: questionTheme,
                cost: questionCost,
                answers: [{
                    answer: firstOption,
                    correct: correctAnswer === "1"
                }, {
                    answer: secondOption,
                    correct: correctAnswer === "2"
                }, {
                    answer: thirdOption,
                    correct: correctAnswer === "3"
                }, {
                    answer: fourthOption,
                    correct: correctAnswer === "4"
                },
                ]
            });
        });

        var response = await fetch(`${host}/api/quiz/create`, {
            method: 'POST',
            headers: {
                Accept: "application/json, text/plain, */*",
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            cache: 'default',
            credentials: "same-origin",
            body: JSON.stringify({
                name: quizName,
                access,
                questions: questionsArray
            })
        });

        const responseJSON = await response.json();

        if (!responseJSON.response) {
            return alert('Произошла ошибка при создания викторины!');
        }

        document.location = '/';
    }
});