db = db.getSiblingDB('CardsDB');

if (!db.getCollectionNames().includes('users')) {
  db.createCollection('users');
}

if (!db.getCollectionNames().includes('cards')) {
  db.createCollection('cards');
}

let user = db.users.findOne({ login: "johnaedo" });
if (!user) {
  // This script runs in the Mongo shell, not through the User model, so the
  // password can't be hashed here automatically. The value below is the
  // bcrypt hash of "ucf123!", made with:
  //   node -e "console.log(require('bcryptjs').hashSync('ucf123!', 10))"
  const result = db.users.insertOne({
    firstName: "John",
    lastName: "Aedo",
    login: "johnaedo",
    password: "$2b$10$dcjsaXblFddld53QThfQAu9WLK7.I4iek3NSg8ruIzpS28Cqd0AIK",
    email: "",
    role: "user"
  });
  user = { _id: result.insertedId };
}

const userIdStr = user._id.toString();

const looneyTunesCards = [
  { playerName: "Bugs Bunny", teamName: "Tune Squad", cardValue: 15000, publisher: "Warner Collectibles", userId: userIdStr },
  { playerName: "Daffy Duck", teamName: "Duck Dodgers", cardValue: 12500, publisher: "Warner Collectibles", userId: userIdStr },
  { playerName: "Porky Pig", teamName: "ACME All-Stars", cardValue: 8500, publisher: "Fleer", userId: userIdStr },
  { playerName: "Yosemite Sam", teamName: "Wild West Legends", cardValue: 9200, publisher: "Donruss", userId: userIdStr },
  { playerName: "Elmer Fudd", teamName: "Hunter Special", cardValue: 7800, publisher: "Topps", userId: userIdStr },
  { playerName: "Tweety Bird", teamName: "Sky High", cardValue: 11000, publisher: "Upper Deck", userId: userIdStr },
  { playerName: "Sylvester the Cat", teamName: "Alley Cats", cardValue: 6900, publisher: "Fleer", userId: userIdStr },
  { playerName: "Tasmanian Devil", teamName: "Tazmanian Whirlwind", cardValue: 18500, publisher: "Panini", userId: userIdStr },
  { playerName: "Road Runner", teamName: "ACME Speedsters", cardValue: 22000, publisher: "Upper Deck", userId: userIdStr },
  { playerName: "Wile E. Coyote", teamName: "Genius Innovator", cardValue: 14000, publisher: "Donruss", userId: userIdStr },
  { playerName: "Foghorn Leghorn", teamName: "Barnyard Heavyweights", cardValue: 9500, publisher: "Topps", userId: userIdStr },
  { playerName: "Speedy Gonzales", teamName: "Fastest Mouse", cardValue: 16000, publisher: "Upper Deck", userId: userIdStr },
  { playerName: "Marvin the Martian", teamName: "Illudium Q-36", cardValue: 27500, publisher: "Panini", userId: userIdStr },
  { playerName: "Pepe Le Pew", teamName: "French Romantics", cardValue: 5400, publisher: "Fleer", userId: userIdStr },
  { playerName: "Lola Bunny", teamName: "Tune Squad Captain", cardValue: 21000, publisher: "Topps", userId: userIdStr },
  { playerName: "Granny", teamName: "Bird Protectors", cardValue: 4200, publisher: "Donruss", userId: userIdStr },
  { playerName: "Michigan J. Frog", teamName: "Broadway Legends", cardValue: 35000, publisher: "Upper Deck", userId: userIdStr },
  { playerName: "Gossamer", teamName: "Red Monster Squad", cardValue: 13500, publisher: "Fleer", userId: userIdStr },
  { playerName: "Taz", teamName: "Wild Spinners", cardValue: 17000, publisher: "Topps", userId: userIdStr },
  { playerName: "Barnyard Dawg", teamName: "Guard Dogs", cardValue: 6100, publisher: "Donruss", userId: userIdStr }
];

looneyTunesCards.forEach(card => {
  if (!db.cards.findOne({ userId: userIdStr, playerName: card.playerName })) {
    db.cards.insertOne(card);
  }
});
