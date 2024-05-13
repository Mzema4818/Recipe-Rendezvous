const form = document.getElementById("bot-form")
const botAnswer = document.getElementById("botAnswer")

form.addEventListener("submit", registerUser)

async function registerUser(event){
    event.preventDefault()
    const input = document.getElementById("input").value

    const result = await fetch("/api/bot", {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({
            input,
        })
    }).then(res => res.json())

    if(result.status === 'ok'){
        
        if(result.input.name == null){
            botAnswer.innerHTML = "<p id='answer'>" + result.input + "</p>"
        }else{
            const currentURL = window.location.href;
            const baseURL = currentURL.replace('/bot', '');
            const itemIDLink = baseURL + '/item/' + result.input._id;

            let build = "<p id='answer'>"
            build += "Yes we have a " + result.input.name + " it is located here <a href='" + itemIDLink + "'>" + result.input.name + " Recipe </a><br>";
            build += "This recipe was made by " + result.input.username
            build += "</p>"

            botAnswer.innerHTML = build
        }
    }
} 
