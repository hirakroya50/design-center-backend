// Run: node -r dotenv/config prisma/seed.js  (requires yarn build first)
require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma');

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const CATEGORIES = [
  { id: 'architecture', name: 'Architecture', tagline: 'Form, light & structure', description: 'Visionary residential and commercial architecture practices shaping landmark spaces.', image: img('photo-1487958449943-2429e8be8625'), subcategories: ['Residential Architecture', 'Commercial Architecture'] },
  { id: 'interior', name: 'Interior Design', tagline: 'Curated living, refined', description: 'Award-winning interior studios for residential and commercial environments.', image: img('photo-1616486338812-3dadae4b4ace'), subcategories: ['Residential Interiors', 'Commercial Interiors'] },
  { id: 'furniture', name: 'Furniture', tagline: 'Bespoke & collectible', description: 'Custom ateliers and luxury houses crafting statement furniture.', image: img('photo-1538688525198-9b88f6f53126'), subcategories: ['Custom Furniture', 'Luxury Furniture'] },
  { id: 'furnishings', name: 'Furnishings', tagline: 'Soft architecture', description: 'Curtains, upholstery and blinds tailored to your space.', image: img('photo-1505693416388-ac5ce068fe85'), subcategories: ['Curtains', 'Upholstery', 'Blinds'] },
  { id: 'surfaces', name: 'Surface Solutions', tagline: 'Stone, marble & quartz', description: 'Natural stone, marble, quartz and tile specialists.', image: img('photo-1615875605825-5eb9bb5d52ac'), subcategories: ['Stone', 'Marble', 'Quartz', 'Tiles'] },
  { id: 'walls', name: 'Wall Solutions', tagline: 'Texture & expression', description: 'Wallpapers, panels and decorative finishes.', image: img('photo-1513519245088-0e12902e5d4'), subcategories: ['Wallpapers', 'Wall Panels', 'Decorative Finishes'] },
  { id: 'styling', name: 'Styling', tagline: 'The finishing note', description: 'Artwork, decor and accessories to complete every room.', image: img('photo-1493809842364-78817add7ffb'), subcategories: ['Artwork', 'Decor', 'Accessories'] },
  { id: 'turnkey', name: 'Turnkey Solutions', tagline: 'End to end, effortless', description: 'Full project management from concept to handover.', image: img('photo-1600585154340-be6161a56a0c'), subcategories: ['End-to-End Project Management'] },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding categories...');
  const results = await Promise.all(
    CATEGORIES.map((cat) =>
      prisma.category.upsert({ where: { id: cat.id }, create: cat, update: cat }),
    ),
  );
  console.log(`Seeded ${results.length} categories:`, results.map((c) => c.id));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
