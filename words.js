'use strict';

// Letters unlocked at each level (cumulative) — Dvorak progression
const LEVEL_CHARS = {
  1:  new Set('aoeuhtns'),
  2:  new Set('aoeuidhtns'),
  3:  new Set('aoeuidhtnsrl'),
  4:  new Set('aoeuidhtnsrlcf'),
  5:  new Set('aoeuidhtnsrlcfgp'),
  6:  new Set('aoeuidhtnsrlcfgpyb'),
  7:  new Set('aoeuidhtnsrlcfgpybmw'),
  8:  new Set('aoeuidhtnsrlcfgpybmwvk'),
  9:  new Set('abcdefghijklmnopqrstuvwxyz'),
  10: new Set("abcdefghijklmnopqrstuvwxyz.,';:!?-"),
};

// Letters unlocked at each level (cumulative) — Colemak/Colemak-DH progression
// Lv 1: home row core (a r s t h n e o) | 2: +i d | 3: +f l | 4: +u p
// Lv 5: +w y | 6: +g m | 7: +b c | 8: +v k | 9-10: full alphabet
const LEVEL_CHARS_COLEMAK = {
  1:  new Set('arsthnoe'),
  2:  new Set('arsthnoe' + 'id'),
  3:  new Set('arsthnoe' + 'id' + 'fl'),
  4:  new Set('arsthnoe' + 'id' + 'fl' + 'up'),
  5:  new Set('arsthnoe' + 'id' + 'fl' + 'up' + 'wy'),
  6:  new Set('arsthnoe' + 'id' + 'fl' + 'up' + 'wy' + 'gm'),
  7:  new Set('arsthnoe' + 'id' + 'fl' + 'up' + 'wy' + 'gm' + 'bc'),
  8:  new Set('arsthnoe' + 'id' + 'fl' + 'up' + 'wy' + 'gm' + 'bc' + 'vk'),
  9:  new Set('abcdefghijklmnopqrstuvwxyz'),
  10: new Set('abcdefghijklmnopqrstuvwxyz'),
};

const WORD_LIST = [
  // 2-letter
  'an','as','at','be','do','go','he','if','in','is','it','me','my',
  'no','of','oh','on','or','so','to','up','us','we',

  // 3-letter (Level 1 guaranteed: only a o e u h t n s)
  'ant','ate','eon','has','hat','hen','hot','hut','not','nut','oat',
  'one','sat','set','she','son','sun','tan','tea','ten','the','toe',
  'ton','tun','use',
  // 3-letter (Level 2+ adds i d)
  'aid','and','din','did','dot','dun','hit','its','nod','sin',
  'sit','tin','too','ids',
  // 3-letter (Level 3+ adds p y f g c r l)
  'ace','act','age','ago','aim','air','all','any','apt','arc','are',
  'art','ash','ask','awe','axe','bog','car','cat','cod','cop','cow',
  'cry','cut','dad','dam','day','den','dew','die','dig','dim','dog',
  'dry','due','dye','ear','eat','egg','ego','end','era','eye','fan',
  'far','fat','few','fig','fin','fit','fly','fog','for','fox','fur',
  'gap','gas','gel','get','god','got','guy','gym','lap','law','lay',
  'led','leg','let','lid','lip','lit','log','lot','low','nap','nor',
  'odd','off','oil','old','opt','ore','our','out','own','pal','pan',
  'pat','paw','pay','pea','peg','pen','per','pet','pie','pig','pin',
  'pit','pop','pot','pro','pub','pun','put','rag','ram','ran','rap',
  'rat','raw','ray','red','rid','rig','rim','rip','rob','rod','rot',
  'row','rub','rug','run','rut','rye','sag','sap','say','sea','sew',
  'shy','sip','sir','ski','sky','sob','sow','soy','spa','sum','sup',
  'tab','tap','tar','tax','thy','tie','tip','top','tot','toy','try',
  'tub','tug','two','van','vat','via','vow','wad','war','was','wax',
  'web','wed','wet','who','why','wig','win','wit','woe','won','wry',
  'yam','yew','yap',
  // 3-letter (Level 4+ adds q j k x b m w v z)
  'bad','bag','ban','bar','bat','bay','bed','bet','bid','big','bit',
  'box','boy','bud','bug','bun','bus','but','buy','cab','can','cap',
  'jam','jar','jaw','jet','joy','jug','keg','kin','kit','lab','lad',
  'mad','man','map','mat','men','met','mob','mop','mud','mug','nab',
  'nip','zip','zap',

  // 4-letter (Level 1)
  'ante','aunt','eons','hate','hats','heat','hens','hone','hose',
  'host','hunt','neat','nest','nose','note','nuts','oats','ones',
  'oust','sane','sate','sent','shoe','shot','shout','snot','soon','soot',
  'stun','suns','tans','taut','teas','tens','than','that','then',
  'thou','thus','toes','tone','tons','tune','unto',
  // 4-letter (Level 2 adds i d)
  'dine','dote','diet','edit','hide','idea','into','node','nods',
  'side','snide','tins','tide','this','dins','dens','ions',
  'sited','hides','odin',
  // 4-letter (Level 3 adds p y f g c r l)
  'able','ache','acid','arch','area','army','axis','back','ball',
  'band','bank','bare','barn','base','bath','bear','beat','beef',
  'been','beer','bell','belt','bend','best','bill','bind','bird',
  'bite','blue','blur','boat','body','bold','bolt','bond','bone',
  'book','boom','boot','bore','born','both','call','calm','came',
  'camp','card','care','cart','case','cash','cast','cave','cell',
  'cent','chin','chip','chop','clam','clap','clay','clip','club',
  'clue','coal','coat','code','coil','coin','cold','comb','come',
  'cook','cool','cope','copy','cord','core','corn','cost','coup',
  'crew','crop','cube','cure','dark','dart','data','date','dawn',
  'dead','deal','dean','dear','deck','deed','deep','deny','desk',
  'dirt','disk','dive','door','dose','drag','draw','drop','drum',
  'dual','dull','dune','dusk','dust','duty','each','earn','east',
  'edge','else','emit','epic','even','ever','evil','exam','face',
  'fact','fail','fair','fall','fame','fare','farm','fast','fate',
  'feat','feed','feel','feet','fell','felt','fend','file','fill',
  'film','find','fine','fire','firm','fish','fist','five','flag',
  'flat','flew','flip','flow','foam','fold','folk','font','fool',
  'ford','fore','fork','form','fort','foul','four','free','fuel',
  'full','fume','fund','fuse','gale','game','gang','gave','glee',
  'glen','glow','glue','goal','gold','gone','good','gown','grab',
  'grin','grip','grew','grit','grow','gulf','gust','hack','hair',
  'half','hall','hand','hang','hard','hare','harm','harp','have',
  'head','heal','heap','hear','heel','held','helm','help','herb',
  'hero','high','hill','hire','hole','home','hood','hook','hope',
  'horn','hour','hymn','idle','inch','iron','isle','item','lack',
  'laid','lake','lamb','lamp','land','lane','last','late','lawn',
  'lead','leaf','lean','leap','left','lens','lick','life','lift',
  'like','lily','lime','line','link','lion','list','live','load',
  'loan','lock','loft','lone','long','look','loom','loop','lord',
  'lore','lose','loss','lost','loud','love','luck','lung','lurk',
  'lust','made','mail','main','make','male','mall','mane','mark',
  'mast','mate','maze','meal','mean','meat','meet','meld','melt',
  'memo','mere','mesh','mile','milk','mill','mind','mine','mint',
  'miss','mist','mode','mole','mood','moon','moor','more','mote',
  'move','much','mule','must','nail','name','nape','navy','near',
  'neck','need','news','next','nice','nine','noon','norm','noun',
  'once','only','open','oven','over','pace','pack','page','paid',
  'pain','pair','pale','palm','park','part','pass','past','path',
  'peak','peel','peer','pest','pick','pile','pine','pipe','plan',
  'play','plea','plot','plow','plug','plus','poem','poet','pole',
  'poll','pond','pool','poor','pore','port','pose','post','pour',
  'pray','prey','prod','prop','pull','pump','pure','push','race',
  'rack','rail','rain','rank','rate','read','real','reap','rear',
  'reel','rely','rent','rest','rice','rich','ride','ring','riot',
  'rise','risk','road','roam','roar','robe','rock','role','roll',
  'roof','room','rope','rose','rout','ruin','rule','rush','safe',
  'sage','sail','sake','sale','salt','same','sand','sang','sank',
  'save','scan','scar','seal','seam','seat','seed','seek','self',
  'sell','shed','ship','shop','show','shut','sick','sign','silk',
  'sing','site','size','skin','slab','slam','slap','sled','slim',
  'slip','slow','slug','snap','snow','soap','sock','soft','soil',
  'sole','some','song','sore','sort','soul','soup','sour','span',
  'spin','spit','spot','spur','star','stay','stem','step','stew',
  'stir','stop','stub','stud','such','suit','sure','swan','swap',
  'swim','take','tale','tall','tame','task','team','tear','tell',
  'term','text','them','they','thin','tick','time','tiny','tire',
  'toad','toil','told','toll','tomb','tore','torn','toss','tour',
  'town','trap','tree','trim','trio','trip','true','tube','tuck',
  'tuna','turf','turn','tusk','twin','type','ugly','undo','unit',
  'upon','used','user','vain','vale','vast','veil','vein','very',
  'vest','view','vine','void','volt','vote','wade','wage','wake',
  'walk','wall','wane','ward','warm','warn','warp','wasp','wave',
  'weak','weld','well','went','were','west','wide','wild','will',
  'wind','wine','wing','wire','wise','wish','wolf','wood','word',
  'wore','work','worm','worn','wrap','yard','yarn','year','yell',
  'your','zone',

  // 5-letter
  'about','above','abuse','actor','adapt','adept','admit','adult',
  'after','again','agent','agree','ahead','aisle','alert','align',
  'alike','alone','along','aloud','alter','among','anger','angle',
  'ankle','anvil','apart','apply','arena','argue','arise','armor',
  'aroma','aside','asset','atone','aunts','avoid','awake','award',
  'badly','basic','basis','batch','beach','began','begin','below',
  'bench','black','blade','blame','blank','blast','blaze','bless',
  'blind','block','blood','bloom','board','bonus','boost','bound',
  'brace','brain','brave','bread','break','breed','bride','brief',
  'bring','broad','brook','brown','brush','build','built','bunch',
  'burst','carry','catch','cause','chain','charm','chart','chase',
  'cheap','check','cheek','cheer','chess','chest','chief','child',
  'civic','claim','clash','class','clean','clear','click','cliff',
  'climb','clock','clone','close','cloud','coach','coast','color',
  'comet','couch','could','count','cover','craft','crane','crash',
  'creek','crisp','cross','crown','crude','crush','crust','curve',
  'cycle','daily','dance','death','decay','delta','dense','depot',
  'depth','dirty','donor','doubt','draft','drain','dream','drift',
  'drill','drink','drive','drone','dying','eager','eagle','early',
  'earth','elect','elbow','elite','empty','enemy','enter','entry',
  'equal','error','event','exact','exist','extra','fable','faith',
  'fancy','fault','feast','fiber','field','fifth','fifty','fight',
  'final','first','fixed','flank','flash','flesh','flock','floor',
  'fluid','flute','focus','force','forge','forth','found','frame',
  'frank','fresh','front','frost','fully','ghost','given','glare',
  'glass','glaze','gleam','globe','gloom','glory','gloss','glove',
  'grace','grade','grant','grasp','grass','grave','great','greed',
  'greet','grief','grind','group','grove','growl','guard','guess',
  'guest','guide','guild','habit','handy','happy','harsh','haunt',
  'haven','heart','heavy','hedge','hence','hinge','hoard','hobby',
  'hoist','horse','hotel','house','human','humor','hurry','image',
  'imply','inner','inset','intro','issue','ivory','jewel','joint',
  'judge','juice','juicy','knife','knock','known','label','lance',
  'large','laser','later','laugh','layer','learn','lease','leave',
  'legal','lemon','level','light','liner','liver','local','lodge',
  'logic','loose','lower','loyal','lucky','lying','magic','major',
  'maple','march','match','mayor','media','merit','metal','might',
  'mirth','mixed','model','money','month','moral','motor','mount',
  'mouse','music','nerve','never','night','noise','north','novel',
  'nurse','occur','offer','often','olive','onset','opera','orbit',
  'order','organ','other','outer','oxide','ozone','panel','panic',
  'paper','party','peace','pearl','penny','perch','phase','phone',
  'photo','piano','piece','pilot','pitch','pixel','place','plain',
  'plane','plant','plate','plead','pluck','point','power','press',
  'price','pride','prime','probe','prone','proof','prose','proud',
  'prove','pulse','pupil','purse','queen','quest','quick','quiet',
  'quota','quote','radar','radio','raise','rally','ranch','range',
  'rapid','razor','reach','ready','realm','rebel','refer','reign',
  'relax','repay','reply','ridge','right','risky','rival','river',
  'robot','rocky','round','royal','ruler','rural','sadly','salad',
  'sauce','scale','scene','scope','score','scout','screw','sense',
  'serve','setup','seven','shade','shaft','shake','shame','shape',
  'share','sharp','shelf','shell','shift','shine','shore','short',
  'shove','sight','since','sixth','sixty','skill','skull','slant',
  'slash','sleep','slice','slide','slope','smell','smile','smoke',
  'snake','solid','solve','south','space','spare','spark','spawn',
  'speak','speed','spell','spend','spice','spike','spine','spite',
  'split','spoke','spoon','sport','spray','squad','staff','stage',
  'stain','stale','stamp','stand','stark','start','state','steel',
  'steep','steer','stern','stick','stiff','still','stock','stomp',
  'stone','stood','store','storm','story','stout','stove','strap',
  'straw','strip','strut','stuck','study','style','sugar','suite',
  'sunny','super','surge','swear','sweat','sweep','sweet','swell',
  'swept','swift','swore','sworn','syrup','table','taunt','teach',
  'teeth','tempo','tense','tenth','theft','their','there','these',
  'thick','thief','thing','think','third','three','threw','throw',
  'thumb','tiger','tight','tired','title','token','torch','total',
  'touch','tough','toxic','trace','track','trade','trail','train',
  'trait','trash','treat','trend','trial','tribe','trick','tried',
  'truck','truly','trunk','trust','truth','tumor','tutor','twist',
  'union','unite','until','upper','upset','urban','usual','utter',
  'vague','valid','valor','value','vapor','vault','verse','video',
  'vigor','viral','virus','visit','vista','vital','vivid','vocal',
  'voice','waist','waste','watch','water','weary','weave','wedge',
  'weigh','whale','wheat','wheel','where','which','while','white',
  'whole','whose','witch','witty','woman','women','world','worry',
  'worse','worst','worth','would','wound','wrath','write','wrong',
  'wrote','yacht','yield','young','yours','youth','zebra',

  // 6-letter
  'absent','access','accord','action','active','actual','adjust',
  'admire','afraid','agency','agreed','allied','almost','almond',
  'always','anchor','answer','anyone','anyway','appear','appeal',
  'around','arrive','artist','aspect','assert','assets','assign',
  'assure','attach','attack','attain','attend','avenue','bakery',
  'barren','battle','beacon','beauty','became','become','before',
  'behalf','behind','belief','belong','betray','beyond','bitter',
  'border','bottle','bounce','branch','breach','bridge','bright',
  'broken','budget','button','candle','castle','casual','caught',
  'cereal','charge','choice','choose','chosen','circle','clause',
  'clever','column','coming','common','corner','cotton','critic',
  'custom','danger','daring','deadly','debate','decent','decide',
  'defend','define','demand','depend','desert','desire','detail',
  'devote','differ','direct','divide','double','driven','during',
  'employ','enable','endure','engage','engine','enough','entire',
  'escape','estate','evenly','evolve','except','excite','exempt',
  'exotic','expand','expert','expose','extend','extent','famine',
  'fasten','father','feline','female','filter','finger','finite',
  'fiscal','forest','formal','former','foster','frozen','garden',
  'gentle','gifted','global','glance','golden','gospel','govern',
  'gravel','ground','growth','happen','harbor','hatred','health',
  'heaven','helper','hidden','higher','highly','hinder','hollow',
  'honest','horror','hunter','impact','income','indeed','infant',
  'inform','injure','insect','insert','inside','intend','invest',
  'island','itself','jungle','killer','knight','launch','lawful',
  'leader','linear','linger','liquid','little','living','longer',
  'lovely','marble','marked','matter','mature','meadow','member',
  'mental','method','middle','mirror','misery','modify','moment',
  'mortal','mostly','motion','muscle','mutual','narrow','nature',
  'nearby','needle','normal','notion','obtain','oppose','option',
  'origin','output','palace','parent','patron','pebble','pencil',
  'people','period','permit','person','pillow','pirate','planet',
  'plenty','poetry','polish','portal','powder','pretty','prison',
  'profit','proper','proven','public','purely','pursue','puzzle',
  'random','rather','reason','recall','recent','reduce','region',
  'remain','remind','remote','render','rescue','result','reveal',
  'review','reward','riddle','safety','salary','sample','sanity',
  'saving','screen','search','season','second','secret','sector',
  'secure','select','senior','series','settle','shadow','simple',
  'single','sister','social','source','speech','sphere','spirit',
  'spread','stable','statue','steady','stolen','strain','stream',
  'street','strict','strike','string','strong','sudden','summit',
  'supply','surely','symbol','system','talent','target','temper',
  'temple','tender','tested','theory','throat','throne','timely',
  'tissue','toward','travel','treaty','tribal','triple','tunnel',
  'tyrant','unkind','update','useful','vanish','velvet','verbal',
  'virtue','voyage','wander','warmth','wealth','weapon','weekly',
  'wholly','wicked','widely','winter','wisdom','within','wonder',
  'worker','yearly',

  // 7-letter
  'abandon','ability','absence','account','achieve','acquire',
  'address','advance','against','ancient','another','anxiety',
  'approve','arrange','attract','balance','because','between',
  'breadth','brother','capable','captain','capture','certain',
  'chapter','citizen','clarity','classic','clearly','climate',
  'combine','command','comment','compare','compete','complex',
  'concern','conduct','confirm','connect','consent','consist',
  'contact','content','control','convert','council','courage',
  'current','dealing','defense','deliver','digital','diverse',
  'element','enforce','enhance','exactly','examine','explore',
  'express','extreme','failure','fashion','feature','fiction',
  'finding','foreign','formula','freedom','further','general',
  'genuine','gradual','history','imagine','improve','include',
  'inspire','instead','justice','largely','lasting','leading',
  'library','limited','logical','loyalty','maximum','meaning',
  'measure','mention','message','minimum','miracle','mission',
  'monitor','morning','network','nothing','observe','opinion',
  'outcome','outside','overall','pattern','perform','perhaps',
  'popular','portion','present','prevent','primary','private',
  'produce','program','project','protect','provide','publish',
  'purpose','quality','quickly','quietly','radical','reality',
  'receive','reflect','release','replace','request','require',
  'reserve','respect','restore','respond','retreat','revenue',
  'reverse','routine','science','section','society','special',
  'species','stadium','stretch','subject','success','suggest',
  'support','surface','survive','tactics','teacher','tension',
  'tonight','trouble','usually','variety','version','veteran',
  'village','violent','visible','visitor','warning','welcome',
  'whether','without','working','written',
];

function getLevelChars(level) {
  return LEVEL_CHARS[level] || LEVEL_CHARS[10];
}

function getWordsForLevel(level, layout) {
  const chars = layout === 'colemak' ? LEVEL_CHARS_COLEMAK : LEVEL_CHARS;
  const allowed = chars[level] || chars[10];
  return WORD_LIST.filter(word =>
    word.split('').every(char => allowed.has(char))
  );
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns a shuffled array of `count` words for the given level
function getRoundWords(level, count, layout) {
  const pool = getWordsForLevel(level, layout);
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

// Returns a shuffled array of `count` words biased toward words that contain
// the most-errored characters from `weakKeys` ({ char: errorCount }).
// Each word gets 1 + min(floor(score/2), 4) copies in the candidate pool,
// where score = sum of error counts for distinct chars in the word.
function getWeightedWords(level, weakKeys, count, layout) {
  const pool = getWordsForLevel(level, layout);
  const keys = weakKeys && typeof weakKeys === 'object' ? weakKeys : {};

  const weighted = [];
  for (const word of pool) {
    const score  = [...new Set(word)].reduce((sum, ch) => sum + (keys[ch] || 0), 0);
    const copies = 1 + Math.min(Math.floor(score / 2), 4);
    for (let i = 0; i < copies; i++) weighted.push(word);
  }

  const seen   = new Set();
  const result = [];
  for (const word of shuffle(weighted)) {
    if (!seen.has(word)) {
      seen.add(word);
      result.push(word);
      if (result.length === count) break;
    }
  }
  return result;
}

// Sentences/passages for Sentences mode. Each uses only chars in the level's allowed set.
// Level 1: aoeuhtns | Level 2: +id | Level 3: +rl | Level 4: +cf | Level 5: +gp
// Level 6: +yb | Level 7: +mw | Level 8: +vk | Level 9: full alphabet
// Level 10: full alphabet + punctuation (.,';:!?-)
const QUOTE_LIST = [
  // Level 1 — only a o e u h t n s
  'use the sun to heat the house',
  'she sent a note at noon',
  'the hen sat on a hot stone',
  'a stone house on the south sea',
  'the heat at noon has no end',
  'the east stones heat the sea',
  'at noon she ate the nuts',

  // Level 2 — + i d
  'the tide is out at sunrise',
  'an idea is not enough on its own',
  'shine and do not hide',
  'this is not the end',
  'the thin sound died inside the shed',
  'do not hide an idea inside',
  'the tide eased and the noise died',
  'add the dish to the stone and heat it',

  // Level 3 — + r l
  'still the noise that hides the truth inside',
  'the hard road leads to the natural order',
  'learn to listen and the truth is not so distant',
  'the road ahead is still under the sun',
  'do the hard trial and rest is earned',
  'the older the error the harder to undo',
  'a short trial tells us the natural order',
  'sit in the shade and let the tired soul rest',
  'the historian noted the ordeal in detail',

  // Level 4 — + c f
  'focus on the task and the rest is certain',
  'the final choice is often the hardest one',
  'reach for the future not the cold of the old',
  'a careful effort leads to certain results',
  'life is full of second chances if the first fails',
  'cold facts do not often reach the final conclusion',
  'force of character is the root of all action',
  'a fresh cold stone is the best seat in the shade',
  'the first draft is often the one that frees the rest',
  'call to action often fails to reach the intended result',

  // Level 5 — + g p
  'progress is not a straight line it spirals and dips',
  'plant the seed and step aside then let it go',
  'great ideas are often plain and grounded in fact',
  'stop and notice the pace of life and its patterns',
  'the goal is progress not perfection at each step',
  'good plans address the gaps not the perfect state',
  'push past the point of comfort and the gain is real',
  'getting to the starting point is often the hardest part',
  'a sharp plan is often the start of real action',
  'open the plan and see the gaps that lead to the goal',

  // Level 6 — + y b
  'build a life and a body that is strong and bright',
  'the best path is often the one no one has yet tried',
  'be still and the light begins to find its place',
  'stay focused and the days begin to bring better results',
  'a bright idea is born in the still of the early day',
  'the body responds best to rest and regular habit',
  'beyond the daily grind lies the life you are trying to build',
  'by the end of the day the effort begins to yield',
  'boys and girls need the space to try and to build',
  'the ability to begin is the single biggest gift you possess',

  // Level 7 — + m w
  'the mind grows stronger with each word it holds and turns',
  'when the work matters the days begin to feel worthwhile',
  'a well written idea is worth more than a muddled one',
  'morning brings a fresh start and the world begins again',
  'write with care and the words will carry their own weight',
  'the moment you stop wanting to grow is the moment things stop',
  'most people want more time but they spend what they have',
  'the world made more sense when the answers were simple',
  'memories are made in the moments we are most present',
  'with effort and attention the mind will always find a way',

  // Level 8 — + v k
  'the voice of a kind heart is never silent in the dark',
  'keep your values close and your work will speak for itself',
  'ask the hard questions and the easy answers fall away',
  'a dark sky is full of light if you know where to look',
  'every kind act leaves a mark even if we never know it',
  'drive forward even when the path is dark and unknown',
  'take the risk and the world takes note of your effort',
  'very few people are alive to the value of stillness',
  'speak kindly and the door opens before you even ask',
  'back to the roots is always a valid path forward',

  // Level 9 — full alphabet, no punctuation
  'the quiet joy of a job well done is its own reward',
  'just begin and the path will reveal itself in time',
  'question everything but judge slowly and with care',
  'the quick fox jumps and the lazy judge barely reacts',
  'extraordinary things begin with a single quiet step',
  'exact answers rarely exist on the first exploration',
  'expect the unexpected and the journey holds no fear',
  'jazz fills the zone with a joyful and unique mix',
  'from zero to expert requires just one extra step each day',
  'the fox and the hound exist in a quiet jungle zone',

  // Level 10 — full alphabet + punctuation; multi-sentence passages
  "writing takes practice. every sentence you type makes the next one come easier. begin small and build from there.",
  "the best ideas often arrive quietly. learn to recognize them before they fade. write them down at once.",
  "you don't have to be perfect; you have to be present. show up every day and the work will compound.",
  "clarity is not the absence of complexity. it's the result of thinking something through until it makes sense.",
  "every expert was once a beginner. the gap between them is nothing more than time, practice, and patience.",
  "some problems require speed; others require stillness. the skill is knowing which one the moment demands.",
  "read slowly to understand. write quickly to create. revise carefully to improve.",
  "don't wait for the perfect moment; it doesn't exist. the best time to start was yesterday; the second-best is now.",
  "habit is the architecture of daily life. build your routines with care, and the hard work becomes effortless.",
  "a good question is worth more than a quick answer. ask it slowly, and then listen even more slowly.",
  "the quiet mind sees what the anxious mind misses. slow down, and you'll find you can move faster.",
  "practice is not what you do once you're good. it's what you do to become good, and then to stay there.",
  "the ability to focus on one task at a time is a rare and valuable skill. most people jump from one thing to the next, losing depth in exchange for speed. resist the urge to multitask; quality requires presence.",
  "every skill you build today is a gift to your future self. the work feels hard in the moment because it is; that difficulty is exactly what makes it valuable. do the hard thing first, and rest comes easy.",
];

function getQuotesForLevel(level) {
  const allowed = getLevelChars(level);
  return QUOTE_LIST.filter(q =>
    [...q].every(c => c === ' ' || allowed.has(c))
  );
}

// Returns a random quote for the level, or '' if none exist.
function getRoundQuote(level) {
  const pool = getQuotesForLevel(level);
  if (pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

if (typeof module !== 'undefined') {
  module.exports = { WORD_LIST, LEVEL_CHARS, LEVEL_CHARS_COLEMAK, getLevelChars, getWordsForLevel, getRoundWords, getWeightedWords, getQuotesForLevel, getRoundQuote };
}
