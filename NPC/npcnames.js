// Name generation functions
function generateName(npc) {
  // prettier-ignore
  const maleNames = [ // prettier-ignore
    "Thiago",
    "Davi",
    "Gustavo",
    "Julio",
    "Carlos",
    "José",
    "Javier",
    "Rafael",
    "Antonio",
    "Alejandro",
    "Carlos",
    "Sergey",
    "Grimaldo",
    "Carlos",
    "Diego",
    "Alejandro",
    "Jose",
    "Mario",
    "Antonio",
    "Javier",
    "Rafael",
    "Fernando",
    "Eduardo",
    "Juan",
    "Miguel",
    "Pedro",
    "Mateo",
    "Sebastian",
    "Manuel",
    "Francisco",
    "Ricardo",
    "Andrés",
    "John",
    "Michael",
    "William",
    "David",
    "James",
    "Robert",
    "Joseph",
    "Daniel",
    "Thomas",
    "Charles",
    "Christopher",
    "Matthew",
    "George",
    "Richard",
    "Edward",
    "Brian",
    "Steven",
    "Kevin",
    "Paul",
    "Donald",
    "Mark",
    "Anthony",
    "Jeffrey",
    "Scott",
    "Kenneth",
    "Benjamin",
    "Joshua",
    "Jason",
    "Andrew",
    "Stephen",
  ];

  const femaleNames = [
    "Esmeralda",
    "Mary",
    "Jennifer",
    "Linda",
    "Patricia",
    "Elizabeth",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Nancy",
    "Lisa",
    "Margaret",
    "Betty",
    "Dorothy",
    "Helen",
    "Sandra",
    "Donna",
    "Carol",
    "Ruth",
    "Sharon",
    "Michelle",
    "Laura",
    "Kimberly",
    "Amy",
    "Angela",
    "Melissa",
    "Rebecca",
    "Deborah",
    "Stephanie",
    "Cynthia",
  ];

  let name = "";
  if (npc.sex === "male") {
    name = maleNames[Math.floor(Math.random() * maleNames.length)];
  } else if (npc.sex === "female") {
    name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
  }
  // Add a random capital letter at the end of the name
  const randomCapitalLetter = String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  );
  name += " " + randomCapitalLetter + ".";

  return name;
}
