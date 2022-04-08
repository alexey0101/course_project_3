const signin = document.querySelector('#signin-button');
signin.addEventListener('click', async () => {
    const username = document.querySelector('#username');
    const password = document.querySelector('#password');
    var status;
    const response = await fetch(`${host}/api/users/login`, {
        method: 'POST',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        credentials: "same-origin",
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    if (response.status != 200) {
        username.value = "";
        password.value = "";
        return alert('Неверные данные для входа!');
    }

    document.location = "/";
});