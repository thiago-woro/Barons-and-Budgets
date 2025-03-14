/**
 * Animation utility for game objects
 * Provides reusable animation functions for various game elements
 */

class Animation {
  /**
   * Create a new animation
   * @param {string} type - Animation type ('pop', 'fade', 'small', 'getBig')
   * @param {string} content - Content to animate (emoji, text, etc.)
   * @param {number} duration - Duration in milliseconds
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} fontSize - Base font size in pixels
   * @returns {Object} Animation object
   */
  static create(type, content, duration = 500, x = 0, y = 0, fontSize = 20) {
    return {
      type,
      content,
      startTime: Date.now(),
      duration,
      x,
      y,
      fontSize
    };
  }

  /**
   * Draw the animation on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} animation - Animation object
   * @returns {boolean} True if animation is still active, false if complete
   */
  static draw(ctx, animation) {
    if (!animation) return false;

    const progress = (Date.now() - animation.startTime) / animation.duration;
    if (progress >= 1) {
      return false;
    }

    const { x, y, content, type, fontSize } = animation;
    ctx.font = `${fontSize}px Arial`;
    
    switch (type) {
      case 'pop':
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5; // Scale between 1 and 1.5
        ctx.font = `${fontSize * scale}px Arial`;
        ctx.fillText(content, x, y);
        break;
      
      case 'fade':
        ctx.globalAlpha = 1 - progress;
        ctx.fillText(content, x, y);
        ctx.globalAlpha = 1;
        break;
      
      case 'small':
        const size = fontSize - (progress * (fontSize / 2)); // Shrink to half size
        ctx.font = `${size}px Arial`;
        ctx.fillText(content, x, y);
        break;

      case 'getBig':
        const growSize = (fontSize / 5) + (progress * (fontSize * 0.8)); // Start small, grow to full size
        ctx.font = `${growSize}px Arial`;
        ctx.fillText(content, x, y);
        break;
        
      case 'pulse':
        const pulseScale = 1 + Math.sin(progress * Math.PI * 3) * 0.2; // Multiple pulses
        ctx.font = `${fontSize * pulseScale}px Arial`;
        ctx.fillText(content, x, y);
        break;
        
      case 'rotate':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(progress * Math.PI * 2);
        ctx.fillText(content, 0, 0);
        ctx.restore();
        break;
    }

    return true;
  }

  /**
   * Update animation position
   * @param {Object} animation - Animation object
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  static updatePosition(animation, x, y) {
    if (animation) {
      animation.x = x;
      animation.y = y;
    }
  }

  /**
   * Check if animation is complete
   * @param {Object} animation - Animation object
   * @returns {boolean} True if animation is complete or null
   */
  static isComplete(animation) {
    if (!animation) return true;
    return (Date.now() - animation.startTime) >= animation.duration;
  }
}

// Make Animation available globally
// Remove module exports
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = { Animation };
// } 