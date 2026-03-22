import { db } from './db.ts';

async function seed() {
  console.log('Starting database seed...');
  
  try {
    await db.init();
    
    // Check if products already exist
    const products = await db.getAll('products');
    if (products.length === 0) {
      console.log('Seeding products...');
      await db.bulkInsert('products', [
        {
          id: 'p1',
          name: 'Classic Sea Moss Gel',
          description: 'Pure, wild-crafted gold sea moss gel. Rich in 92 minerals.',
          imageColor: 'bg-amber-100',
          ingredients: ['Gold Sea Moss', 'Spring Water', 'Key Lime'],
          available: true
        },
        {
          id: 'p2',
          name: 'Elderberry Infused Gel',
          description: 'Immune-boosting sea moss gel with organic elderberries.',
          imageColor: 'bg-purple-100',
          ingredients: ['Gold Sea Moss', 'Spring Water', 'Elderberries', 'Honey'],
          available: true
        },
        {
          id: 'p3',
          name: 'Dragonfruit Sea Moss',
          description: 'Vibrant and antioxidant-rich sea moss gel with pink dragonfruit.',
          imageColor: 'bg-pink-100',
          ingredients: ['Gold Sea Moss', 'Spring Water', 'Dragonfruit', 'Agave'],
          available: true
        }
      ], 'id');
    } else {
      console.log('Products already exist, skipping seed.');
    }

    // Check if ingredients already exist
    const ingredients = await db.getAll('ingredients');
    if (ingredients.length === 0) {
      console.log('Seeding ingredients...');
      await db.bulkInsert('ingredients', [
        { name: 'Gold Sea Moss', available: true },
        { name: 'Purple Sea Moss', available: true },
        { name: 'Elderberries', available: true },
        { name: 'Dragonfruit', available: true },
        { name: 'Key Lime', available: true },
        { name: 'Spring Water', available: true },
        { name: 'Honey', available: true },
        { name: 'Agave', available: true }
      ], 'name');
    } else {
      console.log('Ingredients already exist, skipping seed.');
    }

    console.log('Database seed completed successfully.');
  } catch (error) {
    console.error('Database seed failed:', error);
  }
}

seed();
