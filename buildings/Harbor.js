// Harbor building class
// Load the harbor image once globally
const harborImage = new Image();
harborImage.src = "assets/buildings/harbor.png";
console.log("Loading harbor image from: assets/buildings/harbor.png");

// Add an onload handler to log when the image is loaded
harborImage.onload = function() {
};

class Harbor extends Building {
  constructor(x, y, size, owner) {
    super(x, y, size, owner);
    this.type = "Harbor";
    this.emoji = "⚓";
    this.owner = owner;
    this.resources = Infinity; // Harbors don't deplete
    this.id = `harbor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Log when the harbor is created
    console.log(`Harbor created at (${x}, ${y}) with size ${size}`);
  }

  draw(ctx) {
    // Ensure valid coordinates and size
    if (isNaN(this.x) || isNaN(this.y) || isNaN(this.size)) {
      console.error(`Invalid harbor coordinates: (${this.x}, ${this.y}) with size ${this.size}`);
      return; // Skip drawing if coordinates are invalid
    }
    
    // Draw the harbor image if it's loaded
    if (harborImage && harborImage.complete) {
      // Draw with proper dimensions - make it larger and centered
      const scale = 2.0; // Make it twice as large
      const width = this.size * scale;
      const height = this.size * scale;
      
      // Center the image on the harbor position
      const x = this.x - (width - this.size) / 2;
      const y = this.y - (width - this.size) / 2;
      
      ctx.drawImage(harborImage, x, y, 99, 99);
      
      // Remove the debug log that runs every frame
    } else {
      // If image is not loaded yet, draw a placeholder
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, this.x + this.size/2, this.y + this.size/2);
    }

    const x = this.x / cellSize;
    const y = this.y / cellSize;
    
    // Draw harbor area outline (2x2 grid)
    ctx.strokeStyle = "rgba(0, 100, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize - cellSize/2, y * cellSize - cellSize/2, cellSize * 2, cellSize * 2);
  }
  
  // Animation method
  animateEmoji(animation, emoji, duration) {
    console.log(`Harbor at (${this.x/cellSize}, ${this.y/cellSize}) ${animation} ${emoji}`);
  }
}

// Make Harbor available globally
if (typeof window !== 'undefined') {
  window.Harbor = Harbor;
} 