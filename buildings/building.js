// Base Building class
class Building {
  constructor(x, y, size) {
    this.x = x * size;
    this.y = y * size;
    this.size = size;
    this.type = "Building";
    this.emoji = "🏠";
  }

  draw(ctx) {
    // Draw building background
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  // Animate an emoji above the building
  animateEmoji(animation, emoji, duration) {
    let startTime = Date.now();
    let startY = this.y - 20;
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const ctx = document.getElementById("npcCanvas").getContext("2d");
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        
        if (animation === "fade") {
          ctx.globalAlpha = 1 - progress;
        } else if (animation === "bounce") {
          const bounceHeight = Math.sin(progress * Math.PI) * 20;
          startY = this.y - 20 - bounceHeight;
        }
        
        ctx.fillText(emoji, this.x + this.size/2, startY);
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
} 