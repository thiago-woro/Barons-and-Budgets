
function(instance, properties, context) {
    console.log('running initialize 🚀');
    var model = 3000;
    model++;
    model++;
    console.log(model);
  
  
    //Do the operation
    const testImages = document.querySelectorAll("img");
    console.log("all images: ", testImages.length);
  
  
  const filteredImages = Array.from(testImages).filter(function(image) {
    return image.getAttribute("alt") === "thiago";
  })}

  console.log("Filtered images: ", filteredImages.length);
  
  filteredImages.forEach(function(image) {
        console.log("Filtered images: ", filteredImages.length);
    console.log(image);
  });