import type { Language, Settings } from './typing';

// --- Word collections ---
const english = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been had has did more very still through little never between before while each might place where those again own part around right same great find long life world feel both something under home should must last every thought open begin light end turn keep without hand run head high follow play small move point help much old let line tell next different once always learn read hear leave name change down near enough start together another kind far call air water book word sound quiet room tree sky walk lake morning mind write grow less much night rest slowly toward green clear river window winter summer road sea voice dream follow close thing often story simple across set need well bright ground heart human wonder music hour earth form space stillness carry future better true nature eye become sense fact question answer build rhythm gentle possible today tomorrow understand stay return both during best life take`;
const finnish = `olla ja se ei että hän minä sinä me te he tämä tuo yksi kaksi kolme myös mutta kuin niin kun jos tai vain jo vielä nyt sitten aina usein joskus tässä siellä missä miksi miten aika päivä vuosi hetki elämä ihminen maailma hyvä uusi vanha pieni suuri pitkä kaunis oma sama toinen kaikki moni vähän paljon enemmän koti talo huone ovi ikkuna pöytä kirja sana kieli ääni ajatus mieli käsi silmä sydän valo varjo yö aamu ilta aurinko kuu tähti taivas maa vesi meri järvi joki ranta metsä puu lehti kukka tuuli sade lumi talvi kevät kesä syksy tie matka paikka kaupunki kylä lapsi ystävä perhe työ koulu peli musiikki tarina unelma rauha ilo toivo voima luonto kysymys vastaus lukea kirjoittaa puhua kuulla nähdä katsoa ajatella tietää oppia tuntea tehdä tulla mennä jäädä löytää etsiä antaa ottaa haluta voida pitää saada alkaa jatkaa palata avata sulkea kävellä juosta istua nousta odottaa auttaa kasvaa muistaa unohtaa rakentaa uskoa elää olla hiljaa yhdessä lähellä kaukana eteen taakse alas ylös sisällä ulkona ennen jälkeen kautta yli alla vieressä läpi kohti ilman kanssa todella ehkä lähes aivan hyvin paremmin paras helposti hitaasti nopeasti hiljainen lämmin kylmä selkeä vapaa valmis oikea tärkeä tavallinen seuraava viimeinen molemmat täällä tänään huomenna eilen`;
export const wordLists: Record<Language, string[]> = {
  english: [...new Set(english.split(/\s+/))],
  finnish: [...new Set(finnish.split(/\s+/))],
};
export function makeWords(language: Language, count = 600): string {
  const list = wordLists[language];
  let previous = '';
  return Array.from({ length: count }, () => {
    let word: string;
    do {
      word = list[Math.floor(Math.random() * list.length)];
    } while (word === previous);
    previous = word;
    return word;
  }).join(' ');
}

// --- Curated passages ---
export type Quote = {
  id: string;
  text: string;
  author: string;
  work: string;
  section: string;
  source: string;
  translation: string;
  rights: string;
};
const walden = {
  author: 'Henry David Thoreau',
  work: 'Walden',
  source: 'https://www.gutenberg.org/ebooks/205',
  translation: 'Original English, 1854',
  rights: 'Public-domain original text',
};
const emerson = {
  author: 'Ralph Waldo Emerson',
  work: 'Essays',
  source: 'https://www.gutenberg.org/ebooks/16643',
  translation: 'Original English, 1841–1844',
  rights: 'Public-domain original text',
};
const dhammapada = {
  author: 'Buddhist canon',
  work: 'Dhammapada',
  source: 'https://www.gutenberg.org/ebooks/2017',
  translation: 'F. Max Müller translation, 1881',
  rights: 'Public-domain translation',
};
const epictetus = {
  author: 'Epictetus',
  work: 'The Enchiridion',
  source: 'https://www.gutenberg.org/ebooks/45109',
  translation: 'Thomas Wentworth Higginson translation',
  rights: 'Public-domain translation',
};
export const quotes: Quote[] = [
  {
    ...walden,
    id: 'walden-drummer',
    section: 'Conclusion',
    text: 'If a man does not keep pace with his companions, perhaps it is because he hears a different drummer. Let him step to the music which he hears, however measured or far away.',
  },
  {
    ...walden,
    id: 'walden-woods',
    section: 'Where I Lived, and What I Lived For',
    text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
  },
  {
    ...walden,
    id: 'walden-endeavor',
    section: 'Where I Lived, and What I Lived For',
    text: 'I know of no more encouraging fact than the unquestionable ability of man to elevate his life by a conscious endeavor.',
  },
  {
    ...walden,
    id: 'walden-eyes',
    section: 'Economy',
    text: "Could a greater miracle take place than for us to look through each other's eyes for an instant?",
  },
  {
    ...walden,
    id: 'walden-dawn',
    section: 'Where I Lived, and What I Lived For',
    text: 'We must learn to reawaken and keep ourselves awake, not by mechanical aids, but by an infinite expectation of the dawn, which does not forsake us in our soundest sleep.',
  },
  {
    ...emerson,
    id: 'emerson-trust',
    section: 'Self-Reliance',
    text: 'Trust thyself: every heart vibrates to that iron string. Accept the place the divine providence has found for you, the society of your contemporaries, the connection of events.',
  },
  {
    ...emerson,
    id: 'emerson-friend',
    section: 'Friendship',
    text: 'The only reward of virtue, is virtue; the only way to have a friend is to be one.',
  },
  {
    ...emerson,
    id: 'emerson-surprises',
    section: 'Circles',
    text: 'Life is a series of surprises. We do not guess to-day the mood, the pleasure, the power of to-morrow, when we are building up our being.',
  },
  {
    ...emerson,
    id: 'emerson-enthusiasm',
    section: 'Circles',
    text: 'Nothing great was ever achieved without enthusiasm. The way of life is wonderful. It is by abandonment.',
  },
  {
    ...emerson,
    id: 'emerson-unsettled',
    section: 'Circles',
    text: 'No truth so sublime but it may be trivial to-morrow in the light of new thoughts. People wish to be settled: only as far as they are unsettled is there any hope for them.',
  },
  {
    ...emerson,
    id: 'emerson-truth',
    section: 'Prudence',
    text: 'Trust men and they will be true to you; treat them greatly and they will show themselves great, though they make an exception in your favor to all their rules of trade.',
  },
  {
    ...walden,
    id: 'walden-deliberate',
    section: 'Where I Lived, and What I Lived For',
    text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived. I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary.',
  },
  {
    ...dhammapada,
    id: 'dhammapada-hatred',
    section: 'Verse 5',
    text: 'For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.',
  },
  {
    ...dhammapada,
    id: 'dhammapada-rock-lake',
    section: 'Verses 81–82',
    text: 'As a solid rock is not shaken by the wind, wise people falter not amidst blame and praise. Wise people, after they have listened to the laws, become serene, like a deep, smooth, and still lake.',
  },
  {
    ...dhammapada,
    id: 'dhammapada-one-word',
    section: 'Verse 100',
    text: 'Even though a speech be a thousand (of words), but made up of senseless words, one word of sense is better, which if a man hears, he becomes quiet.',
  },
  {
    ...dhammapada,
    id: 'dhammapada-conquer',
    section: 'Verse 103',
    text: 'If one man conquer in battle a thousand times thousand men, and if another conquer himself, he is the greatest of conquerors.',
  },
  {
    ...dhammapada,
    id: 'dhammapada-restraint',
    section: 'Verses 104–105',
    text: "One's own self conquered is better than all other people; not even a god, a Gandharva, not Mara with Brahman could change into defeat the victory of a man who has vanquished himself, and always lives under restraint.",
  },
  {
    ...dhammapada,
    id: 'dhammapada-victory',
    section: 'Verse 201',
    text: 'Victory breeds hatred, for the conquered is unhappy. He who has given up both victory and defeat, he, the contented, is happy.',
  },
  {
    ...epictetus,
    id: 'epictetus-control',
    section: 'Section I',
    text: 'There are things which are within our power, and there are things which are beyond our power. Within our power are opinion, aim, desire, aversion, and, in one word, whatever affairs are our own. Beyond our power are body, property, reputation, office, and, in one word, whatever are not properly our own affairs.',
  },
  {
    ...epictetus,
    id: 'epictetus-reproach',
    section: 'Section V',
    text: 'It is the action of an uninstructed person to reproach others for his own misfortunes; of one entering upon instruction, to reproach himself; and one perfectly instructed, to reproach neither others nor himself.',
  },
  {
    ...epictetus,
    id: 'epictetus-events',
    section: 'Section VIII',
    text: 'Demand not that events should happen as you wish; but wish them to happen as they do happen, and you will go on well.',
  },
  {
    ...epictetus,
    id: 'epictetus-will',
    section: 'Section IX',
    text: 'Sickness is an impediment to the body, but not to the will unless itself pleases. Lameness is an impediment to the leg, but not to the will; and say this to yourself with regard to everything that happens. For you will find it to be an impediment to something else, but not truly to yourself.',
  },
  {
    ...epictetus,
    id: 'epictetus-faculty',
    section: 'Section X',
    text: 'Upon every accident, remember to turn toward yourself and inquire what faculty you have for its use. If you encounter a handsome person, you will find continence the faculty needed; if pain, then fortitude; if reviling, then patience. And when thus habituated, the phenomena of existence will not overwhelm you.',
  },
  {
    ...epictetus,
    id: 'epictetus-improvement',
    section: 'Section XIII',
    text: 'If you would improve, be content to be thought foolish and dull with regard to externals. Do not desire to be thought to know anything; and though you should appear to others to be somebody, distrust yourself. For be assured, it is not easy at once to keep your will in harmony with nature and to secure externals; but while you are absorbed in the one, you must of necessity neglect the other.',
  },
  {
    id: 'mccarthy-road-memory',
    author: 'Cormac McCarthy',
    work: 'The Road',
    section: 'Brief quotation',
    text: 'You forget what you want to remember and you remember what you want to forget.',
    source: 'https://www.readinggroupguides.com/reviews/the-road/excerpt',
    translation: 'Original English, 2006',
    rights: 'Copyrighted text; brief quotation',
  },
  {
    id: 'mccarthy-no-country-luck',
    author: 'Cormac McCarthy',
    work: 'No Country for Old Men',
    section: 'Brief quotation',
    text: 'You never know what worse luck your bad luck has saved you from.',
    source: 'https://wist.info/mccarthy-cormac/67657/',
    translation: 'Original English, 2005',
    rights: 'Copyrighted text; brief quotation',
  },
];
export function quoteLength(quote: Quote): Settings['quoteLength'] {
  return quote.text.length < 150
    ? 'short'
    : quote.text.length < 250
      ? 'medium'
      : 'long';
}
export function pickQuote(
  length: Settings['quoteLength'],
  previous?: string,
): Quote {
  const pool = quotes.filter(
    (q) => (length === 'all' || quoteLength(q) === length) && q.id !== previous,
  );
  return pool[Math.floor(Math.random() * pool.length)] ?? quotes[0];
}
