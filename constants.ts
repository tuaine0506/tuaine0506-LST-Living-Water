import { Product, GroupName } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'lemon-ginger',
    name: 'Lemon Ginger Shot',
    description: 'A classic immune booster to kickstart your day with a zesty punch.',
    imageColor: '#FBBF24', // amber-400
    ingredients: ['Oranges', 'Lemons', 'Ginger', 'Turmeric', 'Turkey Tail Extract', 'Black Pepper', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 41,
    videoEnd: 145,
    available: true,
  },
  {
    id: 'berry-beet',
    name: 'Berry Beet Energy Shot',
    description: 'A vibrant, earthy shot designed to enhance energy and stamina.',
    imageColor: '#BE185D', // pink-700
    ingredients: ['Strawberries', 'Orange', 'Lemon', 'Beets', 'Ashwagandha Extract', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 145,
    videoEnd: 249,
    available: true,
  },
  {
    id: 'pineapple-mint',
    name: 'Pineapple Mint Coconut Shot',
    description: 'A refreshing tropical blend that aids digestion and soothes the senses.',
    imageColor: '#FCD34D', // amber-300
    ingredients: ['Pineapple', 'Lemon', 'Ginger Root', 'Fresh Mint Leaves', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 249,
    videoEnd: 349,
    available: true,
  },
  {
    id: 'mixed-berry',
    name: 'Mixed Berry Antioxidant Shot',
    description: 'Packed with antioxidants to fight free radicals and support overall health.',
    imageColor: '#4F46E5', // indigo-600
    ingredients: ['Blueberries', 'Cucumber', 'Lemon', 'Ginger Root', 'Black Elderberry Extract'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 349,
    videoEnd: 443,
    available: true,
  },
  {
    id: 'carrot-apple',
    name: 'Carrot Apple Turmeric Shot',
    description: 'A sweet and spicy combination rich in vitamins and anti-inflammatory properties.',
    imageColor: '#F97316', // orange-500
    ingredients: ['Apple', 'Carrots', 'Ginger Root', 'Turmeric', 'Black Pepper', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 443,
    videoEnd: 534,
    available: true,
  },
  {
    id: 'everything-green',
    name: 'Everything Green Mineral Shot',
    description: 'A potent dose of greens to mineralize your body and boost vitality.',
    imageColor: '#16A34A', // green-600
    ingredients: ['Cucumbers', 'Celery', 'Green Apple', 'Parsley', 'Spinach', 'Matcha Powder', 'Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 534,
    videoEnd: 641,
    available: true,
  },
];

export const GROUP_NAMES: GroupName[] = [
    GroupName.GroupA,
    GroupName.GroupB,
    GroupName.GroupC,
    GroupName.GroupD,
];