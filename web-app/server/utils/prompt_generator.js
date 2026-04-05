const templates = [
  `{character_adj} {character} discovers {object} {location}, but {condition}.`,
  `{character_adj} {character} receives {object} with a message that reads: "{message}".`,
  '{character_adj} {character} must {goal}, but {secondary_character} is trying to stop them.',
  `before {event}, {character_adj} {character} must {goal}, or {consequence}.`,
  `{character_adj} {character} and {secondary_character} both want {object}, but {condition}.`,
  `after discovering {object}, {character_adj} {character} makes a rash decision—but {condition}.`,
  `when {strange_event} {location}, everybody ignores it—except {character_adj} {character}.`,
  `{character_adj} {character} realizes {condition}, and must decide whether to {goal}.`,
  `when {object} appears {location}, {character_adj} {character} is forced to {goal}.`,
  `everyone believes {condition}, but {character_adj} {character} knows the truth.`
];

const general_word_banks = {
  character: [
    "traveler",
    "survivor",
    "detective",
    "college student",
    "journalist",
    "merchant",
    "scientist",
    "artist",
    "librarian",
    "messenger",
    "teacher",
    "musician",
    "author",
    "photographer",
    "athlete",
    "programmer",
    "witness",
    "suspect"
  ],

  character_adj: [
    "a young",
    "an experienced",
    "a quiet",
    "a curious",
    "a disgraced",
    "a paranoid",
    "an obsessive",
    "an overly ambitious",
    "a sleep-deprived",
    "a guilt-ridden"
  ],

  secondary_character: [
    "a rival",
    "an old friend",
    "a mysterious stranger",
    "a former partner",
    "a childhood friend",
    "a traveling companion",
    "a curious journalist",
    "a determined investigator"
  ],

  object: [
    "a locked journal",
    "a strange key",
    "a sealed envelope",
    "an old photograph",
    "a broken watch",
    "a weathered map",
    "a small wooden box",
    "a glass bottle",
    "a faded diary",
    "a mysterious coin",
    "an antique compass",
    "a bundle of letters"
  ],

  location: [
    "in an abandoned town",
    "in a quiet village",
    "in a crowded marketplace",
    "on a lonely road",
    "inside of a forgotten library",
    "inside of an isolated cabin",
    "in a small coastal town",
    "in a narrow alley",
    "on a remote island",
    "inside an underground tunnel",
    "in a dusty attic",
    "at an old train station",
    "in a public park"
  ],

  event: [
    "sunrise",
    "noon",
    "midnight",
    "a town festival",
    "a sudden storm",
    "a citywide blackout",
    "a wedding",
    "a funeral",
    "an important meeting"
  ],

  strange_event: [
    "with each passing day, people feel lighter than before",
    "everyone forgets the same person",
    "people grow slightly less aware of one another each day",
    "reflections begin moving on their own",
    "someone they know disappears without a trace",
    "they begin hearing their own thoughts spoken aloud",
    "a stranger recognizes them—but they’ve never met",
    "they wake up with memories that aren’t theirs"
  ],

  message: [
    "You were not meant to find this",
    "Meet me before midnight",
    "Trust no one",
    "You were right all along",
    "Burn this after reading",
    "Someone is watching",
    "You must leave tonight",
    "It begins again"
  ],

  goal: [
    "deliver a message that could change everything",
    "uncover the truth behind a long-buried secret",
    "protect something that was never meant to be found",
    "reach the meeting point before it's too late",
    "escape before the situation turns deadly",
    "meet a contact who may not be trustworthy",
    "stay one step ahead of someone hunting them",
    "decipher a message no one else can understand",
    "find out who is really behind it all",
    "prove something everyone else denies",
    "track down someone who doesn’t want to be found",
    "figure out what’s real and what isn’t",
    "prevent a mistake that can’t be undone"
  ],

  condition: [
    "it's being kept hidden for a reason",
    "they may not survive long enough to understand it",
    "they're being watched",
    "every answer only leads to more questions",
    "it isn't what it first appeared to be",
    "they can’t trust their own memory",
    "they are being framed for something they didn’t do",
    "they’re already too late to stop what’s coming",
    "someone they trusted has betrayed them",
    "someone is manipulating what they think they know",
    "they can’t tell anyone what they’ve discovered"
  ]
};

const genre_specific_word_banks = {
  horror: {
    add: {
      character: [
        "mortician",
        "night guard",
        "medium",
        "psychologist",
        "paranormal investigator"
      ],

      object: [
        "an old tape recorder",
        "a blood-stained journal",
        "an antique doll",
        "a rusty crucifix"
      ],

      location: [
        "in an empty parking garage",
        "in an abandoned church",
        "at a cemetery covered in heavy fog"
      ],

      message: [
        "you shouldn't have come here",
        "you won't be alone much longer",
        "it's your turn now"
      ]
    },

    override: {
      strange_event: [
        "the lights start flickering in a constant rhythm",
        "the wind stops all at once",
        "shadows linger around longer than their owners"
      ]
    }
  }
};

function randomItem(array) 
{
  return array[Math.floor(Math.random() * array.length)];
}

function generatePrompt(genre)
{
  const template = randomItem(templates);
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const initial_word_bank = general_word_banks[key];
    let final_word_bank = initial_word_bank;

    if(!initial_word_bank)
    {
      return match;
    }

    if(genre && genre_specific_word_banks[genre])
    {
      if(genre_specific_word_banks[genre].override[key])
      {
        final_word_bank = genre_specific_word_banks[genre].override[key];
      }

      else if(genre_specific_word_banks[genre].add[key])
      {
        final_word_bank = [...initial_word_bank, ...genre_specific_word_banks[genre].add[key]];
      }
    }

    return randomItem(final_word_bank);
  });
}

module.exports = {generatePrompt};