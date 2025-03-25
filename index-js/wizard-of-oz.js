const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const url = 'https://mosttechs.com/wizard-of-oz-slots-free-coins/';
const currentDate = getCurrentDate();
const dir = 'links-json';
const filePath = path.join(dir, 'wizard-of-oz.json');

async function main() {
  try {
    let existingLinks = [];
    if (await fs.access(filePath).then(() => true).catch(() => false)) {
      try {
        const fileData = await fs.readFile(filePath, 'utf8');
        existingLinks = fileData ? JSON.parse(fileData) : [];
      } catch (error) {
        console.error('Error reading existing links:', error);
      }
    }

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const newLinks = [];

    $('a[href*="zynga.social"]').each((index, element) => {
      const link = $(element).attr('href');
      const existingLink = existingLinks.find(l => l.href === link);
      const date = existingLink ? existingLink.date : currentDate;
      newLinks.push({ href: link, date: date });
    });

    let combinedLinks = [...newLinks, ...existingLinks]
      .reduce((acc, link) => {
        if (!acc.some(l => l.href === link.href)) {
          acc.push(link);
        }
        return acc;
      }, [])
      .slice(0, 30);

    // Ensure all links have a date
    combinedLinks = combinedLinks.map(link => ({
      ...link,
      date: link.date || currentDate
    }));

    if (!await fs.access(dir).then(() => true).catch(() => false)) {
      await fs.mkdir(dir);
    }

    await fs.writeFile(filePath, JSON.stringify(combinedLinks, null, 2), 'utf8');
    console.log('Links saved to wizard-of-oz.json:', combinedLinks);
  } catch (err) {
    console.error('Error fetching links:', err);
    process.exit(1);
  }
}

main();