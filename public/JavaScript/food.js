const textEl = document.getElementById('text');
var text = textEl.textContent;
textEl.textContent = "";

let idx = 0; // Initialize idx to 0
let speed = 50;

writeText();

function writeText() {
    textEl.innerText = text.slice(0, idx);

    idx++;

    if (idx <= text.length) { // Check if idx is still within the length of text
        setTimeout(writeText, speed);
    }
}

const boxes = document.querySelectorAll('.box')

window.addEventListener('scroll', checkBoxes)

checkBoxes()

function checkBoxes() {
    const triggerBottom = window.innerHeight / 5 * 4

    boxes.forEach(box => {
        const boxTop = box.getBoundingClientRect().top

        if(boxTop < triggerBottom) {
            box.classList.add('show')
        } else {
            box.classList.remove('show')
        }
    })
}