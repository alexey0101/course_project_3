const test = document.querySelector('#logout');
test.addEventListener('click', async () => {
    var status;
    const response = await fetch(`${host}/api/users/logout`, {
        method: 'POST',
        headers: {
            Accept: "application/json, text/plain, */*",
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        credentials: "same-origin",
    });

    if (response.status != 200) {
        return alert('Ошибка!');
    }

    document.location = '/';
});