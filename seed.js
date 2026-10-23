const mongoose = require('mongoose');
require('dotenv').config();
const { User, Card } = require('./models');

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/CardsDB';

const looneyTunesCards = [
  { playerName: "Bugs Bunny", teamName: "Tune Squad", cardValue: 15000, publisher: "Warner Collectibles" },
  { playerName: "Daffy Duck", teamName: "Duck Dodgers", cardValue: 12500, publisher: "Warner Collectibles" },
  { playerName: "Porky Pig", teamName: "ACME All-Stars", cardValue: 8500, publisher: "Fleer" },
  { playerName: "Yosemite Sam", teamName: "Wild West Legends", cardValue: 9200, publisher: "Donruss" },
  { playerName: "Elmer Fudd", teamName: "Hunter Special", cardValue: 7800, publisher: "Topps" },
  { playerName: "Tweety Bird", teamName: "Sky High", cardValue: 11000, publisher: "Upper Deck" },
  { playerName: "Sylvester the Cat", teamName: "Alley Cats", cardValue: 6900, publisher: "Fleer" },
  { playerName: "Tasmanian Devil", teamName: "Tazmanian Whirlwind", cardValue: 18500, publisher: "Panini" },
  { playerName: "Road Runner", teamName: "ACME Speedsters", cardValue: 22000, publisher: "Upper Deck" },
  { playerName: "Wile E. Coyote", teamName: "Genius Innovator", cardValue: 14000, publisher: "Donruss" },
  { playerName: "Foghorn Leghorn", teamName: "Barnyard Heavyweights", cardValue: 9500, publisher: "Topps" },
  { playerName: "Speedy Gonzales", teamName: "Fastest Mouse", cardValue: 16000, publisher: "Upper Deck" },
  { playerName: "Marvin the Martian", teamName: "Illudium Q-36", cardValue: 27500, publisher: "Panini" },
  { playerName: "Pepe Le Pew", teamName: "French Romantics", cardValue: 5400, publisher: "Fleer" },
  { playerName: "Lola Bunny", teamName: "Tune Squad Captain", cardValue: 21000, publisher: "Topps" },
  { playerName: "Granny", teamName: "Bird Protectors", cardValue: 4200, publisher: "Donruss" },
  { playerName: "Michigan J. Frog", teamName: "Broadway Legends", cardValue: 35000, publisher: "Upper Deck" },
  { playerName: "Gossamer", teamName: "Red Monster Squad", cardValue: 13500, publisher: "Fleer" },
  { playerName: "Taz", teamName: "Wild Spinners", cardValue: 17000, publisher: "Topps" },
  { playerName: "Barnyard Dawg", teamName: "Guard Dogs", cardValue: 6100, publisher: "Donruss" }
];

async function seedDB() {
  try {
    await mongoose.connect(url);
    console.log('Connected to MongoDB server via Mongoose');

    let user = await User.findOne({ login: 'johnaedo' });

    if (!user) {
      user = await User.create({
        firstName: 'John',
        lastName: 'Aedo',
        login: 'johnaedo',
        password: 'ucf123!' // hashed by the User model before saving
      });
      console.log('Seeded initial user: johnaedo');
    } else {
      console.log('User "johnaedo" already exists');
    }

    const userIdStr = user._id.toString();
    let seededCount = 0;

    for (const card of looneyTunesCards) {
      const existing = await Card.findOne({
        userId: userIdStr,
        playerName: card.playerName
      });

      if (!existing) {
        await Card.create({
          ...card,
          userId: userIdStr
        });
        seededCount++;
      }
    }

    console.log(`Seeded ${seededCount} Looney Tunes cards for user johnaedo.`);
    console.log('Database seeding complete.');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedDB();
