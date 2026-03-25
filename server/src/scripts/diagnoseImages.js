const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { connectMongo } = require('../config/mongodb');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');

async function summarize(model, idField, label) {
  const docs = await model.find({}).lean();
  const withImage = docs.filter((d) => Boolean(d.image_url));
  const withoutImage = docs.length - withImage.length;

  console.log(`\n${label}`);
  console.log('- total:', docs.length);
  console.log('- with image_url:', withImage.length);
  console.log('- without image_url:', withoutImage);

  const sample = withImage.slice(0, 5).map((d) => ({
    id: d[idField],
    image_url: d.image_url,
  }));

  if (sample.length > 0) {
    console.log('- sample with image_url:');
    console.log(sample);
  }
}

async function main() {
  await connectMongo();
  await summarize(LostItem, 'lost_item_id', 'Lost Items');
  await summarize(FoundItem, 'found_item_id', 'Found Items');
  process.exit(0);
}

main().catch((error) => {
  console.error('Image diagnostics failed:', error);
  process.exit(1);
});