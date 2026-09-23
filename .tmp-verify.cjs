const fs = require('fs');
const home = fs.readFileSync('dist/index.html', 'utf8');
const beach = fs.readFileSync('dist/beach/index.html', 'utf8');

function tag(h, open) {
  const i = h.indexOf(open);
  if (i < 0) return null;
  const s = i + open.length;
  const e = h.indexOf('>', s);
  return h.slice(s, e);
}
function attr(h, name) {
  const open = 'name="' + name + '" content="';
  const i = h.indexOf(open);
  if (i < 0) return null;
  const s = i + open.length;
  const e = h.indexOf('"', s);
  return h.slice(s, e);
}

console.log('HOME <title>:', tag(home, '<title>'));
console.log('HOME desc   :', attr(home, 'description'));
console.log('BEACH <title>:', tag(beach, '<title>'));
console.log('BEACH desc   :', attr(beach, 'description'));
console.log('BEACH canonical:', attr2(beach, 'canonical'));
function attr2(h, rel) {
  const open = 'rel="' + rel + '" href="';
  const i = h.indexOf(open);
  if (i < 0) return null;
  const s = i + open.length;
  const e = h.indexOf('"', s);
  return h.slice(s, e);
}
console.log('BEACH schema Beach:', beach.includes('"@type":"Beach"'),
  '| aggregateRating:', beach.includes('"aggregateRating"'),
  '| openingHours:', beach.includes('"openingHoursSpecification"'),
  '| telephone:', beach.includes('+81557866218'),
  '| maps sameAs:', beach.includes('maps.app.goo.gl'));
console.log('BEACH desc has 駐車場:', attr(beach, 'description').includes('駐車場'));
console.log('HOME has TouristAttraction:', home.includes('"TouristAttraction"'), '| FAQPage:', home.includes('"FAQPage"'));
