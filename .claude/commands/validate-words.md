Test the getWordsForLevel() function for all 5 levels and print word counts.

!node -e "
const fs = require('fs');
const src = fs.readFileSync('/Users/caseybray/.local/dvorak/words.js', 'utf8');
eval(src);
for (let i = 1; i <= 5; i++) {
  const words = getWordsForLevel(i);
  console.log('Level ' + i + ': ' + words.length + ' words — sample: ' + words.slice(0, 5).join(', '));
}
"
