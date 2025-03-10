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

// Item class for inventory system
class Item {
  constructor(type, amount = 1) {
    this.type = type;
    this.amount = amount;
    this.emoji = this.getEmoji();
  }

  getEmoji() {
    const emojiMap = {
      'wood': '🪵',
      'meat': '🥩',
      'fish': '🐟',
      'ore': '💎',
      'rice': '🌾'
    };
    return emojiMap[this.type] || '❓';
  }

  // Add items of the same type
  add(amount) {
    this.amount += amount;
  }

  // Remove items
  remove(amount) {
    if (this.amount >= amount) {
      this.amount -= amount;
      return true;
    }
    return false;
  }
}
