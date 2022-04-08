const signup = document.querySelector('#signup-button');
signup.addEventListener('click', async () => {
    const username = document.querySelector('#username');
    const password = document.querySelector('#password');
    const confirmPassword = document.querySelector('#confirm-password');

    if (username.value.length === 0) {
        return alert('Укажите имя пользователя!');
    }

    if (username.value.length < 5) {
        return alert('Имя пользователя должно содержать минимум 5 символов!');
    }

    if (password.value.length < 5) {
        return alert('Пароль должен содержать минимум 5 символов!');
    }

    if (password.value !== confirmPassword.value) {
        confirmPassword.value = "";
        return alert('Пароли не совпадают!');
    }

    const response = await fetch(`${host}/api/users`, {
        method: 'POST',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    if (response.status === 409) {
        username.value = '';
        return alert('Пользователь с таким именем уже существует!');
    }

    if (response.status != 201) {
        return alert('Некорректные данные!');
    }
    //var header = "Bearer " + json.token;
    //document.cookie = "Authorization=" + header;

    document.location = "/";
});