function Search() {
    // Declare variables
    var input, filter, ul, li, div, i;
    input = document.getElementById("mySearch");
    filter = input.value.toUpperCase();
    ul = document.getElementById("myMenu");
    li = ul.getElementsByTagName("li");
    
    let searchLength = document.getElementById("searchLength");
    let num = 0

    for (i = 0; i < li.length; i++) {
      div = li[i].getElementsByTagName("div")[0];
      if (div.innerHTML.toUpperCase().indexOf(filter) > -1) {
        li[i].style.display = "";
        num++
      } else {
        li[i].style.display = "none";
      }
    }

  searchLength.innerText = num
}