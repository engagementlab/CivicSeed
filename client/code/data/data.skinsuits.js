// Ideally, this is JSON, and is formatted as such
// But the browserify module bundled with socketstream
// does not currently support JSON, so we just
// manually attach it to module.exports

module.exports = {
  "outfits": {
    "basic": {
      "id": "basic",
      "name": "Default Look",
      "description": "This is you. You look great!",
      "effect": null,
      "flag": null,
      "head": {
        "name": "Default Head",
        "description": "Your beautiful face.",
        "effect": null,
        "flag": null
      },
      "torso": {
        "name": "Default Body",
        "description": "Your heart is in here somewhere.",
        "effect": null,
        "flag": null
      },
      "legs": {
        "name": "Default Legs",
        "description": "These legs are made for walking.",
        "effect": null,
        "flag": null
      }
    },
    "tuxedo": {
      "id": "tuxedo",
      "name": "Tuxedo",
      "description": "You are ready for a night out on Calliope!",
      "effect": "A top hat makes any outfit classier, right?",
      "flag": "",
      "head": {
        "name": "Tuxedo Mask",
        "description": "My, but you look dashing!",
        "effect": "???",
        "flag": ""
      },
      "torso": {
        "name": "Tuxedo Jacket",
        "description": "Or maybe more of a cummerbund...",
        "effect": "",
        "flag": ""
      },
      "legs": {
        "name": "Tuxedo Pants",
        "description": "Don’t forget to shine your shoes.",
        "effect": "",
        "flag": ""
      }
    },
    "lion": {
      "id": "lion",
      "name": "Lion",
      "description": "You are Lion. Hear you roar.",
      "effect": "I wonder how this head would look on different bodies...",
      "flag": "",
      "head": {
        "name": "Lion Head",
        "description": "The Mane Event.",
        "effect": "???",
        "flag": ""
      },
      "torso": {
        "name": "Lion Body",
        "description": "Have you been working out?",
        "effect": "",
        "flag": ""
      },
      "legs": {
        "name": "Lion Legs",
        "description": "Don’t press paws.",
        "effect": "",
        "flag": ""
      }
    },
    "cactus": {
      "id": "cactus",
      "name": "Cactus",
      "description": "Your prickly personality hides a beautiful desert bloom.",
      "effect": "How does a cactus get ahead?",
      "flag": "",
      "head": {
        "name": "Cactus Head",
        "description": "You’re ready to “Head” over to the Ranch...",
        "effect": "???",
        "flag": ""
      },
      "torso": {
        "name": "Cactus Body",
        "description": "How about a hug?",
        "effect": "",
        "flag": ""
      },
      "legs": {
        "name": "Cactus Legs",
        "description": "You’re the fastest cactus in the west.",
        "effect": "",
        "flag": ""
      }
    },
    "cone": {
      "id": "cone",
      "name": "Ice Cream Cone",
      "description": "You look delicious.",
      "effect": "Have you heard the legend of the Sprinkle-Saurus?",
      "flag": "",
      "head": {
        "name": "Strawberry Scoop",
        "description": "So cold. So fare.",
        "effect": "???",
        "flag": ""
      },
      "torso": {
        "name": "Sugar Cone Top",
        "description": "CRUNCH!",
        "effect": "",
        "flag": ""
      },
      "legs": {
        "name": "Sugar Cone Bottom",
        "description": "Don’t spring a leak!",
        "effect": "",
        "flag": ""
      }
    },
    "astronaut": {
      "id": "astronaut",
      "name": "Astronaut",
      "description": "You’re ready for the final frontier.",
      "effect": "You have global radar. All characters with resources are highlighted in the mini-map!",
      "flag": "global-radar",
      "head": {
        "name": "Space Helmet",
        "description": "Ground Control to Major Tom...",
        "effect": "You have local radar. Characters with resources near you are highlighted.",
        "flag": "local-radar"
      },
      "torso": {
        "name": "Space Suit",
        "description": "Commencing countdown, engines on.",
        "effect": "You have local radar. Characters with resources near you are highlighted.",
        "flag": "local-radar"
      },
      "legs": {
        "name": "Space Pants",
        "description": "Press ignition, and may space pants be with you!",
        "effect": "You have local radar. Characters with resources near you are highlighted.",
        "flag": "local-radar"
      }
    },
    "ninja": {
      "id": "ninja",
      "name": "Ninja",
      "description": "A shady ninja costume.",
      "effect": "",
      "flag": "",
      "head": {
        "name": "Ninja Mask",
        "description": "You could be anybody.",
        "effect": "",
        "flag": ""
      },
      "torso": {
        "name": "Ninja Gi",
        "description": "This mysterious Gi can grant you powers...",
        "effect": "???",
        "flag": ""
      },
      "legs": {
        "name": "Ninja Pants",
        "description": "These pants of mystery must be combined the Gi...",
        "effect": "???",
        "flag": ""
      }
    },
    "horse": {
      "id": "horse",
      "name": "Horse",
      "description": "You’re a horse!",
      "effect": "You walk a lot faster!",
      "flag": "speed-max",
      "head": {
        "name": "Horse Head",
        "description": "You have a horse’s head. The best part of the horse.",
        "effect": "You walk slightly faster.",
        "flag": "speed-up"
      },
      "torso": {
        "name": "Horse Body",
        "description": "You have a horse’s body. You’re probably mythical.",
        "effect": "You walk slightly faster.",
        "flag": "speed-up"
      },
      "legs": {
        "name": "Horse Legs",
        "description": "Get ready to gallop!",
        "effect": "You walk slightly faster.",
        "flag": "speed-up"
      }
    },
    "penguin": {
      "id": "penguin",
      "name": "Penguin",
      "description": "Hey, don’t you already have a tuxedo?",
      "effect": "",
      "flag": "",
      "head": {
        "name": "Penguin Head",
        "description": "How adorable!",
        "effect": "???",
        "flag": ""
      },
      "torso": {
        "name": "Penguin Suit",
        "description": "Nice flippers!",
        "effect": "",
        "flag": ""
      },
      "legs": {
        "name": "Penguin Feet",
        "description": "Looks like you’re ready to march 1,000 miles and sit on an egg.",
        "effect": "",
        "flag": ""
      }
    },
    "dinosaur": {
      "id": "dinosaur",
      "name": "Dinosaur",
      "description": "You’re an awesome dinosaur. The ground shakes at your approach!",
      "effect": "",
      "flag": "",
      "head": {
        "name": "Dinosaur Head",
        "description": "So scale. Much teeth.",
        "effect": "",
        "flag": ""
      },
      "torso": {
        "name": "Dinosaur Body",
        "description": "Making things into ’zillas since 2013.",
        "effect": "???",
        "flag": ""
      },
      "legs": {
        "name": "Dinosaur Legs",
        "description": "Combine with Dino Body for ultimate stompage.",
        "effect": "???",
        "flag": ""
      }
    },
    "octopus": {
      "id": "octopus",
      "name": "Octopus",
      "description": "You’re an octopus, smartest of all cephalopods.",
      "effect": "Your paint radius goes up by three.",
      "flag": "paint-max",
      "head": {
        "name": "Octopus Head",
        "description": "Where the octo-brain is kept.",
        "effect": "Your paint radius goes up by one.",
        "flag": "paint-up-1"
      },
      "torso": {
        "name": "Octopus Body",
        "description": "Technically octopuses don’t have heads, just bodies. The more you know.",
        "effect": "Your paint radius goes up by one.",
        "flag": "paint-up-2"
      },
      "legs": {
        "name": "Eight Legs",
        "description": "They see you crawling. You painting.",
        "effect": "Your paint radius goes up by one.",
        "flag": "paint-up-3"
      }
    },
    "hunter": {
      "id": "hunter",
      "name": "Forest Hunter",
      "description": "You stalk the forest like the lion ninja you are.",
      "effect": "You can teleport to the forest! Just chat FOREST (all caps)",
      "flag": "teleport-forest",
      "parts": {
        "head": "lion",
        "torso": "ninja",
        "legs": "ninja"
      }
    },
    "mariner": {
      "id": "mariner",
      "name": "Sub-Mariner",
      "description": "You are at home in aquatic environments.",
      "effect": "You can teleport to the port! Just chat PORT (all caps)",
      "flag": "teleport-port",
      "parts": {
        "head": "penguin",
        "torso": "ninja",
        "legs": "ninja"
      }
    },
    "rancher": {
      "id": "rancher",
      "name": "Ranch Ronin",
      "description": "The stealth cactus could be anywhere.",
      "effect": "You can teleport to the ranch! Just chat RANCH (all caps)",
      "flag": "teleport-ranch",
      "parts": {
        "head": "cactus",
        "torso": "ninja",
        "legs": "ninja"
      }
    },
    "mayor": {
      "id": "mayor",
      "name": "Ninja Mayor",
      "description": "You’re the king or queen of town.",
      "effect": "You can teleport to Calliope Town Square! Just chat TOWN (all caps)",
      "flag": "teleport-town",
      "parts": {
        "head": "tuxedo",
        "torso": "ninja",
        "legs": "ninja"
      }
    },
    "sprinkle": {
      "id": "sprinkle",
      "name": "Sprinklesaurus Rex",
      "description": "A cold-blooded cone with extra sprinkles.",
      "effect": "You gain 10 paintbrush seeds every time you click “Seed it!” on a friend’s response.",
      "flag": "pledge-reward",
      "parts": {
        "head": "cone",
        "torso": "dinosaur",
        "legs": "dinosaur"
      }
    }
  }
}