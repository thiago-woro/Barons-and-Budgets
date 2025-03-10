const items = {
  book: {
    name: "Book",
    emoji: "📗",
    price: 10,
    weight: 1,
    size: "medium",
  },
  hammer: {
    name: "Hammer",
    emoji: "🔨",
    price: 15,
    weight: 2,
    size: "medium",
  },
  keys: {
    name: "Keys",
    emoji: "🔑",
    price: 2,
    weight: 0.1,
    size: "small",
  },
  ore: {
    name: "Ore",
    emoji: "💎",
    price: 8,
    weight: 3,
    size: "medium",
  },
};

// Example usage:
console.log(items.beer); // Accessing the properties of the "Beer" item
console.log(items.book); // Accessing the properties of the "Book" item

const foods = {
  beer: {
    name: "Beer",
    emoji: "🍺",
    price: 5,
    weight: 0.5,
    type: "beverage",
  },

  bread: {
    name: "Bread",
    emoji: "🍞",
    price: 2,
    weight: 0.3,
    type: "grain",
  },
  cheese: {
    name: "Cheese",
    emoji: "🧀",
    price: 4,
    weight: 0.5,
    type: "dairy",
  },
  apple: {
    name: "Apple",
    emoji: "🍎",
    price: 1,
    weight: 0.2,
    type: "fruit",
  },
  roastedMeat: {
    name: "Roasted Meat",
    emoji: "🍖",
    price: 6,
    weight: 0.8,
    type: "meat",
  },
  fish: {
    name: "Fish",
    emoji: "🐟",
    price: 5,
    weight: 0.6,
    type: "seafood",
  },
  honey: {
    name: "Honey",
    emoji: "🍯",
    price: 3,
    weight: 0.4,
    type: "sweetener",
  },
  nuts: {
    name: "Nuts",
    emoji: "🥜",
    price: 4,
    weight: 0.4,
    type: "snack",
  },
  mushrooms: {
    name: "Mushrooms",
    emoji: "🍄",
    price: 3,
    weight: 0.3,
    type: "vegetable",
  },
  soup: {
    name: "Soup",
    emoji: "🍲",
    price: 4,
    weight: 0.6,
    type: "stew",
  },
  wine: {
    name: "Wine",
    emoji: "🍷",
    price: 8,
    weight: 0.7,
    type: "beverage",
  },
  // Add more fantasy medieval foods as needed
};

// Example usage:
console.log(foods.bread); // Accessing the properties of the "Bread" food
console.log(foods.roastedMeat); // Accessing the properties of the "Roasted Meat" food

// Item class for use in inventory system
class Item {
  constructor(type, amount = 1) {
    this.type = type;
    this.amount = amount;
    
    // Get item details from the items or foods objects
    const itemDetails = items[type] || foods[type] || { name: type, emoji: "❓" };
    this.name = itemDetails.name || type;
    this.emoji = itemDetails.emoji || "❓";
  }
  
  add(amount) {
    this.amount += amount;
    return this.amount;
  }
  
  remove(amount) {
    if (this.amount >= amount) {
      this.amount -= amount;
      return true;
    }
    return false;
  }
}

// Make it available globally if we're in a browser
if (typeof window !== 'undefined') {
  window.Item = Item;
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { items, foods, Item };
}
