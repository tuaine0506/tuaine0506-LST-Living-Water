import { Product, GroupName, DonationTier } from './types';

export const FUNDRAISING_GOAL = 100;

export const DONATION_TIERS: DonationTier[] = [
  {
    id: 'friendship',
    name: 'Friendship Offering',
    amount: 50,
    reward: 'Digital Thank You Card',
  },
  {
    id: 'blessing',
    name: 'Blessing Basket',
    amount: 100,
    reward: "Name on our Virtual 'Wall of Donors'",
  },
  {
    id: 'generosity',
    name: 'Generosity Pillar',
    amount: 250,
    reward: 'Early Access to Event Updates & Special Recognition',
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'lemon-ginger',
    name: 'Lemon Ginger Shot',
    description: 'A powerful immune-boosting blend of Vitamin C-rich citrus and anti-inflammatory turmeric and ginger. Perfect for kickstarting your metabolism and fighting off colds.',
    imageColor: '#FBBF24', // amber-400
    ingredients: ['Oranges', 'Lemons', 'Ginger', 'Turmeric', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 41,
    videoEnd: 145,
    available: true,
  },
  {
    id: 'berry-beet',
    name: 'Berry Beet Energy Shot',
    description: 'A stamina-enhancing elixir combining nitrate-rich beets with antioxidant-packed berries and adaptogenic Ashwagandha. Designed to improve blood flow and natural energy levels.',
    imageColor: '#BE185D', // pink-700
    ingredients: ['Strawberries', 'Orange', 'Lemon', 'Beets', 'Ashwagandha Extract', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 145,
    videoEnd: 249,
    available: false,
  },
  {
    id: 'pineapple-mint',
    name: 'Pineapple Mint Coconut Shot',
    description: 'A tropical digestive aid featuring bromelain-rich pineapple and soothing mint. Hydrating coconut water makes this a refreshing way to support gut health.',
    imageColor: '#FCD34D', // amber-300
    ingredients: ['Pineapple', 'Lemon', 'Ginger Root', 'Fresh Mint Leaves', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 249,
    videoEnd: 349,
    available: false,
  },
  {
    id: 'mixed-berry',
    name: 'Mixed Berry Antioxidant Shot',
    description: 'A potent defense against oxidative stress, loaded with anthocyanins from blueberries and immune-supporting elderberry. Great for cellular health and recovery.',
    imageColor: '#4F46E5', // indigo-600
    ingredients: ['Blueberries', 'Cucumber', 'Lemon', 'Ginger Root', 'Black Elderberry Extract'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 349,
    videoEnd: 443,
    available: false,
  },
  {
    id: 'carrot-apple',
    name: 'Carrot Apple Turmeric Shot',
    description: 'A glowing skin and eye health tonic. Beta-carotene from carrots meets the anti-inflammatory power of turmeric, activated by black pepper for maximum absorption.',
    imageColor: '#F97316', // orange-500
    ingredients: ['Apple', 'Carrots', 'Ginger Root', 'Turmeric', 'Black Pepper', 'Water/Coconut Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 443,
    videoEnd: 534,
    available: false,
  },
  {
    id: 'everything-green',
    name: 'Everything Green Mineral Shot',
    description: 'Your daily dose of liquid vitality. Packed with alkalizing greens, hydrating cucumber, and energizing matcha to detoxify and mineralize your body.',
    imageColor: '#16A34A', // green-600
    ingredients: ['Cucumbers', 'Celery', 'Green Apple', 'Parsley', 'Spinach', 'Matcha Powder', 'Water'],
    youtubeId: 'vXbFEIrTpg8',
    videoStart: 534,
    videoEnd: 641,
    available: false,
  },
  {
    id: 'elderberry-zinc',
    name: 'Elderberry Zinc Shot',
    description: 'The ultimate cold and flu fighter. Concentrated elderberry extract pairs with immune-critical zinc and soothing ginger to keep your defenses strong.',
    imageColor: '#4F46E5',
    ingredients: ['Elderberry Extract', 'Zinc Gluconate (optional)', 'Ginger Root', 'Lemon', 'Water/Coconut Water'],
    youtubeId: 'exampleVideoId123',
    videoStart: 10,
    videoEnd: 60,
    available: false,
  },
];

export const GROUP_NAMES: GroupName[] = [
    GroupName.GroupA,
    GroupName.GroupB,
    GroupName.GroupC,
    GroupName.GroupD,
];