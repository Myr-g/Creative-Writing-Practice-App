const templates = [
  `in {location}, {character} discovers {object}.`,
  `{character} receives {object} with a message that reads: "{message}".`,
  `before {event}, {character} must {goal}.`,
  `{character} and {secondary_character} both want {object}, but {condition}.`,
  `the discovery of {object} results in a rash decision, but {condition}.`,
  `one day, a {character} discovers {strange_event}.`,
];

const general_word_banks = {
  character: [
    "a traveler",
    "a detective",
    "a student",
    "a journalist",
    "a merchant",
    "a scientist",
    "an artist",
    "a caretaker",
    "a historian",
    "a librarian",
    "a messenger",
    "a teacher",
    "a musician",
    "an explorer"
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
    "an abandoned town",
    "a quiet village",
    "a crowded marketplace",
    "a lonely road",
    "a forgotten library",
    "an isolated cabin",
    "a small coastal town",
    " narrow alley",
    "a remote island",
    "an underground tunnel",
    "a dusty attic",
    "an old train station",
    "a public park"
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
    "an imporant meeting"
  ],

  strange_event: [
    "gravity stops working",
    "everyone forgets the same person",
    "time rpeats every hour",
    "all reflections disappear"
  ],

  message: [
    "You were not meant to find this.",
    "Meet me before midnight.",
    "Trust no one.",
    "You were right all along.",
    "Burn this after reading.",
    "Someone is watching.",
    "You must leave tonight.",
    "It begins again."
  ],

  condition: [
    "revealing it could bring about disaster",
    "someone else is already looking for it",
    "nobody knows the full truth",
    "someone is hiding a secret",
    "time is running out"
  ]
};

const genre_specific_word_banks = {

};

function randomItem(array) 
{
  return array[Math.floor(Math.random() * array.length)];
}
