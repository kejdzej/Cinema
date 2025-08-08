require('dotenv').config();
const { query } = require('./connection');
const { logger } = require('../utils/logger');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    logger.info('Starting database seeding...');

    // Insert roles
    await query(`
      INSERT INTO roles (name) VALUES 
        ('admin'),
        ('staff'),
        ('customer')
      ON CONFLICT (name) DO NOTHING
    `);

    // Get role IDs
    const roles = await query('SELECT id, name FROM roles');
    const roleMap = {};
    roles.rows.forEach(role => {
      roleMap[role.name] = role.id;
    });

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, is_active)
      VALUES ('admin@cinema.com', $1, 'Admin', 'User', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [adminPasswordHash]);

    if (adminResult.rows.length > 0) {
      await query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [adminResult.rows[0].id, roleMap.admin]);
    }

    // Create test customer
    const customerPasswordHash = await bcrypt.hash('customer123', 10);
    const customerResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, is_active)
      VALUES ('customer@test.com', $1, 'Test', 'Customer', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [customerPasswordHash]);

    if (customerResult.rows.length > 0) {
      await query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [customerResult.rows[0].id, roleMap.customer]);
    }

    // Insert sample films
    const films = [
      {
        title: 'Oppenheimer',
        description: 'Epicka historia człowieka, który wynalazł bombę atomową i musiał żyć z jej skutkami.',
        genre: 'Biograficzny, Dramat',
        director: 'Christopher Nolan',
        actors: 'Cillian Murphy, Emily Blunt, Matt Damon',
        duration_min: 180,
        premiere_date: '2023-07-21',
        age_rating: '16+',
        poster_url: 'pictures/oppenheimer.jpeg'
      },
      {
        title: 'Lilo & Stitch',
        description: 'Historia dziewczynki i jej kosmicznego przyjaciela, pełna humoru i emocji.',
        genre: 'Animacja, Komedia',
        director: 'Dean DeBlois',
        actors: 'Daveigh Chase, Chris Sanders',
        duration_min: 85,
        premiere_date: '2002-06-21',
        age_rating: '0+',
        poster_url: 'pictures/lilo-stitch.jpg'
      },
      {
        title: 'Aladdin',
        description: 'Magiczna opowieść o miłości, przygodzie i zaczarowanej lampie.',
        genre: 'Fantasy, Musical',
        director: 'Guy Ritchie',
        actors: 'Mena Massoud, Naomi Scott, Will Smith',
        duration_min: 128,
        premiere_date: '2019-05-24',
        age_rating: '0+',
        poster_url: 'pictures/aladdin.jpg'
      },
      {
        title: 'Marvel Avengers',
        description: 'Superbohaterowie łączą siły, by uratować świat przed zagładą.',
        genre: 'Akcja, Sci-Fi',
        director: 'Joss Whedon',
        actors: 'Robert Downey Jr., Chris Evans, Scarlett Johansson',
        duration_min: 143,
        premiere_date: '2012-04-11',
        age_rating: '12+',
        poster_url: 'pictures/marvel.jpg'
      },
      {
        title: 'Venom',
        description: 'Dziennikarz staje się gospodarzem symbionta o mrocznej mocy.',
        genre: 'Sci-Fi, Thriller',
        director: 'Ruben Fleischer',
        actors: 'Tom Hardy, Michelle Williams',
        duration_min: 112,
        premiere_date: '2018-10-05',
        age_rating: '16+',
        poster_url: 'pictures/venom.jpg'
      }
    ];

    for (const film of films) {
      await query(`
        INSERT INTO films (title, description, genre, director, actors, duration_min, premiere_date, age_rating, poster_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [film.title, film.description, film.genre, film.director, film.actors, film.duration_min, film.premiere_date, film.age_rating, film.poster_url]);
    }

    // Create sample room
    const roomResult = await query(`
      INSERT INTO rooms (name, total_rows, total_cols, is_active)
      VALUES ('Sala 1', 8, 12, true)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);

    let roomId;
    if (roomResult.rows.length > 0) {
      roomId = roomResult.rows[0].id;
      
      // Create seats for the room
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (let seatNum = 1; seatNum <= 12; seatNum++) {
          let seatType = 'standard';
          if (rowIndex === 7) seatType = 'sofa'; // Last row is sofa
          else if (rowIndex === 4) seatType = 'vip'; // Middle row is VIP
          
          await query(`
            INSERT INTO seats (room_id, row_label, seat_number, type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [roomId, rows[rowIndex], seatNum, seatType]);
        }
      }
    } else {
      // Get existing room if insert failed
      const existingRoom = await query('SELECT id FROM rooms WHERE name = $1', ['Sala 1']);
      roomId = existingRoom.rows[0].id;
    }

    // Get film IDs for showtimes
    const filmIds = await query('SELECT id, title FROM films LIMIT 3');
    
    // Create sample showtimes (next 7 days)
    const today = new Date();
    for (let day = 0; day < 7; day++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + day);
      
      for (let hour = 12; hour <= 20; hour += 3) {
        const showTime = new Date(showDate);
        showTime.setHours(hour, 0, 0, 0);
        
        const filmId = filmIds.rows[day % filmIds.rows.length].id;
        
        await query(`
          INSERT INTO showtimes (film_id, room_id, starts_at, base_price_cents, language, format)
          VALUES ($1, $2, $3, $4, 'pl', '2D')
          ON CONFLICT DO NOTHING
        `, [filmId, roomId, showTime, 2200]);
      }
    }

    // Insert sample snack items
    const snacks = [
      { name: 'Popcorn duży', description: 'Duży kubełek popcornu', price_cents: 3000 },
      { name: 'Popcorn średni', description: 'Średni kubełek popcornu', price_cents: 2800 },
      { name: 'Popcorn mały', description: 'Mały kubełek popcornu', price_cents: 2200 },
      { name: 'Nachos z sosem ostrym', description: 'Nachos z ostrym sosem', price_cents: 2000 },
      { name: 'Nachos z sosem łagodnym', description: 'Nachos z łagodnym sosem', price_cents: 2000 },
      { name: 'Cola 500ml', description: 'Napoje na wybór: Cola, Pepsi, Fanta, Ice Tea', price_cents: 1000 }
    ];

    for (const snack of snacks) {
      await query(`
        INSERT INTO snack_items (name, description, price_cents, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT DO NOTHING
      `, [snack.name, snack.description, snack.price_cents]);
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
