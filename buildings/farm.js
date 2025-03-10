// Farm building class
class Farm extends Building {
  constructor(x, y, size, owner) {
    super(x, y, size);
    this.type = "Farm";
    this.emoji = "🏡";
    this.owner = owner;
    this.resources = Infinity; // Farms never deplete
  }

  draw(ctx) {
    super.draw(ctx);
    // Draw farm emoji
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x + this.size/2, this.y + this.size/2);
  }
} 