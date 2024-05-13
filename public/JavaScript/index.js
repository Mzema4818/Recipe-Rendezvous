var mealMeal = document.getElementById("mealMeal");
var textMeal = document.getElementById("textMeal");

var length = recipes.length

document.addEventListener("DOMContentLoaded", function() {
    var image1 = document.getElementById("image1");
    var image2 = document.getElementById("image2");

    setInterval(function() {
    var random1 = Math.floor(Math.random() * length);


    if (image1.style.opacity === "0") {
        image1.style.opacity = "1";
        image1.src = recipes[random1]
        image2.style.opacity = "0";
    } else {
        image1.style.opacity = "0";
        image2.style.opacity = "1";
        image2.src = recipes[random1]
    }

    mealMeal.textContent = "For " + mealType[random1] + ":"
    textMeal.textContent = mealName[random1]

    }, 3000);
});