const form = document.getElementById("reg-form")
form.addEventListener("submit", recipeUpload)

const stepList = document.getElementById("whereStepsGo");
const stepForm = document.getElementById("steps")

async function recipeUpload(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name");
    const image = formData.get("image");
    const meal = formData.get("meal");

    let build = ""
    //divide by 5 because we are adding 5 elements per new step
    for(let i = 0; i < stepList.childElementCount; i++){
        let info = stepList.querySelector("#step" + (i + 1))
        let pElement = info.querySelector("p");
        let text = pElement.textContent.split(")")[1]
        build += text + "<br>"
    }

    formData.set("steps", build);

    const result = await fetch("/api/recipeUpload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .catch(error => console.error('There was an error uploading the recipe:', error));

    if (result && result.status === 'ok') {
        window.location.href = "myRecipes";
    } else {
        alert(result.error); //having a hard time getting the error
    }
}

function addSteps(){
    if(stepForm.value == "" || stepForm.value.includes("<")) return

    var idNum = ((stepList.childElementCount) + 1)

    var build = "";
    build += "<div class='stepList' id='list" + idNum + "'>"
    build +=    "<div id='step" + idNum + "'>"
    build +=        "<span class='stepText'>"
    build +=            "<p>" + idNum + ") " + stepForm.value + "</p>";
    build +=        "</span>";
    build +=        "<span class='deleteButton'>";
    build +=            "<button class='button' onclick='deleteStep(\"" + idNum + "\")'>X</button></span>";
    build +=        "</span>"
    build +=    "</div>";
    build += "</div>"
    
    stepList.innerHTML += build;
    stepForm.value = ""
}

function deleteStep(clickedID){
    var div = document.getElementById('list' + clickedID);

    div.remove();

    // Update the numbering of the remaining elements
    var stepLists = document.querySelectorAll('.stepList');
    
    for (var i = 0; i < stepLists.length; i++) {
        var stepText = stepLists[i].querySelector('.stepText p');
        var deleteButton = stepLists[i].querySelector('.deleteButton button');
        var newIndex = i + 1;

        stepText.textContent = newIndex + ") " + stepText.textContent.split(') ')[1];
        
        // Update IDs
        stepLists[i].id = 'list' + newIndex;
        stepText.parentNode.id = 'step' + newIndex;
        deleteButton.parentNode.id = 'list' + newIndex;

        // Update onclick attribute
        deleteButton.setAttribute("onclick", "deleteStep('" + newIndex + "')");
    }
}

var loadFile = function(event) {
    var reader = new FileReader();
    reader.onload = function(){
      var output = document.getElementById('output');
      output.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
};