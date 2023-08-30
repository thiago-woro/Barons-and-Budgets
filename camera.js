//all code related to zoom, pan, etc

console.log('camera.js file loaded')


// Function 8
function zoom8(event) {
    event.preventDefault();

    // Getting the viewBox values
    var viewBox = div.getAttribute("viewBox").split(" ").map(Number);
    var scale = event.deltaY < 0 ? 1 / (1 + zoomStep) : 1 / (1 - zoomStep);

    // Finding the new viewBox size
    var newWidth = viewBox[2] * scale;
    var newHeight = viewBox[3] * scale;

    // Making sure the new size is within bounds
    if (newWidth < 30) newWidth = 30;
    if (newWidth > 900) newWidth = 900;
    if (newHeight < 30) newHeight = 30;
    if (newHeight > 900) newHeight = 900;

    // Finding the change in size
    var dWidth = newWidth - viewBox[2];
    var dHeight = newHeight - viewBox[3];

    // Updating the viewBox to center on the same point
    viewBox[0] -= dWidth / 2;
    viewBox[1] -= dHeight / 2;
    viewBox[2] = newWidth;
    viewBox[3] = newHeight;

    // Applying the new viewBox
    div.setAttribute("viewBox", viewBox.join(" "));

    console.log("Zoom8 ", newWidth.toFixed(2), newHeight.toFixed(2)); // Console log the result
}

var div = document.getElementById("canvas-container");
var zoomStep = 0.1;
div.addEventListener("wheel", zoom8);

//grid size slider to change map size
document
    .getElementById("gridSizeSlider")
    .addEventListener("input", function () {
        gridSize = parseInt(this.value);
        document.getElementById("gridSizeDisplay").textContent = gridSize;
        console.log("Grid size initialized: ", gridSize);
    });

// Function 9
function startPan9(event) {
    if (event.shiftKey) { // Check if Shift key is pressed
        div.style.cursor = "grabbing";
        startX = event.clientX;
        startY = event.clientY;
        div.addEventListener("mousemove", pan10);
        div.addEventListener("mouseup", endPan11);
        div.addEventListener("mouseleave", endPan11);
    }
}


// Function 10
function pan10(event) {
    if (event.shiftKey) { // Check if Shift key is pressed
        var x = event.clientX - startX;
        var y = event.clientY - startY;
        div.style.transform += " translate(" + x + "px," + y + "px)";
        startX = event.clientX;
        startY = event.clientY;
    }
}


// Function 11
function endPan11(event) {
    if (!isShiftPressed) {
        div.style.cursor = "grab";
        div.removeEventListener("mousemove", pan10);
        div.removeEventListener("mouseup", endPan11);
        div.removeEventListener("mouseleave", endPan11);
    }
}


var isShiftPressed = false;

window.addEventListener("keydown", function (event) {
    if (event.key === "Shift") {
        isShiftPressed = true;
    }
});

window.addEventListener("keyup", function (event) {
    if (event.key === "Shift") {
        isShiftPressed = false;
    }
});


var startX, startY;
div.style.cursor = "grab";
div.addEventListener("mousedown", startPan9);
div.addEventListener("wheel", zoom8);

// Function 7: Toggles the visibility of the ground canvas based on the checkbox state
function toggleGroundCanvas7() {
    var groundCheckbox = document.getElementById("ground");
    groundCanvas.style.display = groundCheckbox.checked ? "block" : "none";
    console.log(
        "toggleGroundCanvas7 - Ground Canvas Toggled:",
        groundCheckbox.checked
    );
}

// Function 8: Toggles the visibility of the water canvas based on the checkbox state
function toggleWaterCanvas8() {
    var waterCheckbox = document.getElementById("Water");
    waterCanvas.style.display = waterCheckbox.checked ? "block" : "none";
    console.log(
        "toggleWaterCanvas8 - Water Canvas Toggled:",
        waterCheckbox.checked
    );
}

// Event Listener for Ground Checkbox
document
    .getElementById("ground")
    .addEventListener("change", toggleGroundCanvas7);

// Event Listener for Water Checkbox
document
    .getElementById("Water")
    .addEventListener("change", toggleWaterCanvas8);