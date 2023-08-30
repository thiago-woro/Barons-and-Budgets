/* document.addEventListener("DOMContentLoaded", () => {

const resizeHandle = document.getElementById("resize-handle");
const resizableCol = document.getElementById("game");
const toolsCol = document.getElementById("tools");

let isResizing = false;

   // Retrieve the stored width from local storage
   const storedWidth = localStorage.getItem("gameWidth");
   console.log('Found stored width: ' + storedWidth + "px")


   // Set the initial width of the #game element
   if (storedWidth) {
       resizableCol.style.width = storedWidth + "px";
   }

resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;

    // Store initial mouse position and resizable column width
    const initialMouseX = e.clientX;
    const initialWidth = resizableCol.offsetWidth;

    // Prevent text selection during resize
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);

    function resize(e) {
        if (!isResizing) return;

        const deltaX = e.clientX - initialMouseX;
        const newWidth = initialWidth + deltaX;

        // Ensure the column doesn't become too narrow
        if (newWidth > 500) {
            resizableCol.style.width = newWidth + "px";
        }
    }

    function stopResize() {
        if (!isResizing) return;

        isResizing = false;
        document.body.style.userSelect = ""; // Restore text selection

        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResize);
          // Save the updated width to local storage
    const newWidth = resizableCol.offsetWidth;
    localStorage.setItem("gameWidth", newWidth);
    console.log('saved game width as: ' + newWidth)
    }

  
});

// Prevent resizing from interfering with other interactions
resizeHandle.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Adjust tools column width as resizable column changes
window.addEventListener("resize", () => {
    const colWidth = resizableCol.offsetWidth;
    toolsCol.style.width = `calc(100% - ${colWidth}px)`;
});


console.log("imported file uitools.js 🔧");
}); */