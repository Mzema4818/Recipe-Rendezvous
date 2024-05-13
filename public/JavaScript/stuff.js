function logout() {
    fetch('/logout', {
        method: 'POST'
    }).then(res => {
        if (res.redirected) {
            window.location.href = "register";
        }
    })
}