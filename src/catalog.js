(function (root) {
  "use strict";

  const CHARACTERS = [
    {
      id: "mara",
      name: "Mara Venn",
      callsign: "WARD",
      role: "Vanguard",
      description: "Balanced armor, reliable damage, and a stronger close-range blade.",
      weaponId: "arc-needle",
      hp: 36,
      armor: 4,
      reserve: 30,
      patches: 2,
      pulses: 2,
      damageBonus: 1,
      meleeBonus: 2,
      critBonus: 0.02,
      rangeBonus: 0,
      healBonus: 0,
      tokenBonus: 0,
      damageReduction: 0,
      palette: {
        skin: "#d6a17d",
        hair: "#17222b",
        primary: "#2d4a58",
        secondary: "#ef765f",
        accent: "#62d8d0",
        light: "#e8f0e9"
      }
    },
    {
      id: "kael",
      name: "Kael Rune",
      callsign: "FARSHOT",
      role: "Sharpshooter",
      description: "Longer weapon range and a greatly improved critical-hit chance.",
      weaponId: "rail-finch",
      hp: 29,
      armor: 1,
      reserve: 24,
      patches: 2,
      pulses: 1,
      damageBonus: 0,
      meleeBonus: 0,
      critBonus: 0.12,
      rangeBonus: 1,
      healBonus: 0,
      tokenBonus: 0,
      damageReduction: 0,
      palette: {
        skin: "#9d664d",
        hair: "#ece7d9",
        primary: "#3b344d",
        secondary: "#d879b5",
        accent: "#efc65b",
        light: "#f5efe4"
      }
    },
    {
      id: "imani",
      name: "Imani Sol",
      callsign: "MENDER",
      role: "Field Medic",
      description: "Carries extra patches and restores substantially more health.",
      weaponId: "rift-repeater",
      hp: 34,
      armor: 2,
      reserve: 36,
      patches: 4,
      pulses: 2,
      damageBonus: 0,
      meleeBonus: 0,
      critBonus: 0,
      rangeBonus: 0,
      healBonus: 8,
      tokenBonus: 0,
      damageReduction: 0,
      palette: {
        skin: "#754b38",
        hair: "#151518",
        primary: "#28493c",
        secondary: "#75c98a",
        accent: "#79b9d7",
        light: "#e7f1e8"
      }
    },
    {
      id: "tor",
      name: "Tor Vale",
      callsign: "BASTION",
      role: "Bulwark",
      description: "Highest vitality, reinforced armor, and reduced incoming damage.",
      weaponId: "ember-scatter",
      hp: 46,
      armor: 9,
      reserve: 22,
      patches: 2,
      pulses: 1,
      damageBonus: 0,
      meleeBonus: 1,
      critBonus: 0,
      rangeBonus: 0,
      healBonus: 0,
      tokenBonus: 0,
      damageReduction: 1,
      palette: {
        skin: "#ba7b58",
        hair: "#4b2d25",
        primary: "#4d4540",
        secondary: "#ef9a62",
        accent: "#efc65b",
        light: "#efe8df"
      }
    },
    {
      id: "nyx",
      name: "Nyx Arden",
      callsign: "QUICKSILVER",
      role: "Vault Runner",
      description: "Starts with more pulses and extracts additional tokens from enemies.",
      weaponId: "volt-carbine",
      hp: 31,
      armor: 2,
      reserve: 32,
      patches: 2,
      pulses: 4,
      damageBonus: 0,
      meleeBonus: 0,
      critBonus: 0.04,
      rangeBonus: 0,
      healBonus: 0,
      tokenBonus: 0.25,
      damageReduction: 0,
      palette: {
        skin: "#c58c6d",
        hair: "#202029",
        primary: "#343c55",
        secondary: "#6f7ee8",
        accent: "#62d8d0",
        light: "#e9ecf5"
      }
    }
  ];

  const WEAPONS = [
    {
      id: "arc-needle",
      name: "Arc Needle",
      className: "Sidearm",
      description: "Steady sidearm with efficient ammunition use.",
      min: 4,
      max: 7,
      range: 5,
      magazine: 8,
      cost: 0,
      unlockFloor: 1,
      color: "#62d8d0",
      trait: "Reliable",
      critBonus: 0,
      closeBonus: 0,
      shots: 1,
      splash: 0
    },
    {
      id: "rift-repeater",
      name: "Rift Repeater",
      className: "Burst SMG",
      description: "Fires two lighter projectiles in a single turn.",
      min: 3,
      max: 5,
      range: 5,
      magazine: 12,
      cost: 110,
      unlockFloor: 1,
      color: "#79b9d7",
      trait: "2-shot burst",
      critBonus: 0,
      closeBonus: 0,
      shots: 2,
      splash: 0
    },
    {
      id: "ember-scatter",
      name: "Ember Scatter",
      className: "Scattergun",
      description: "Devastating at close range, but limited at distance.",
      min: 7,
      max: 11,
      range: 4,
      magazine: 5,
      cost: 135,
      unlockFloor: 1,
      color: "#ef9a62",
      trait: "+5 damage within 2 tiles",
      critBonus: 0,
      closeBonus: 5,
      shots: 1,
      splash: 0
    },
    {
      id: "rail-finch",
      name: "Rail Finch",
      className: "Long Rifle",
      description: "Extended range with a high critical-hit chance.",
      min: 6,
      max: 10,
      range: 8,
      magazine: 5,
      cost: 150,
      unlockFloor: 1,
      color: "#d879b5",
      trait: "+18% critical chance",
      critBonus: 0.18,
      closeBonus: 0,
      shots: 1,
      splash: 0
    },
    {
      id: "volt-carbine",
      name: "Volt Carbine",
      className: "Carbine",
      description: "Fast-handling rifle with a deep magazine.",
      min: 5,
      max: 8,
      range: 6,
      magazine: 10,
      cost: 165,
      unlockFloor: 2,
      color: "#6f7ee8",
      trait: "Deep magazine",
      critBonus: 0.04,
      closeBonus: 0,
      shots: 1,
      splash: 0
    },
    {
      id: "suncoil",
      name: "Suncoil",
      className: "Solar Rifle",
      description: "High-output rifle tuned for the middle vault.",
      min: 7,
      max: 11,
      range: 7,
      magazine: 7,
      cost: 230,
      unlockFloor: 3,
      color: "#efc65b",
      trait: "+6% critical chance",
      critBonus: 0.06,
      closeBonus: 0,
      shots: 1,
      splash: 0
    },
    {
      id: "prism-lance",
      name: "Prism Lance",
      className: "Beam Rifle",
      description: "Precision beam weapon with extreme single-target power.",
      min: 10,
      max: 15,
      range: 8,
      magazine: 5,
      cost: 340,
      unlockFloor: 4,
      color: "#e67fc1",
      trait: "+10% critical chance",
      critBonus: 0.1,
      closeBonus: 0,
      shots: 1,
      splash: 0
    },
    {
      id: "bloom-cannon",
      name: "Bloom Cannon",
      className: "Heavy Launcher",
      description: "Heavy shot damages enemies beside the primary target.",
      min: 12,
      max: 18,
      range: 6,
      magazine: 4,
      cost: 480,
      unlockFloor: 5,
      color: "#ef765f",
      trait: "3 splash damage",
      critBonus: 0,
      closeBonus: 0,
      shots: 1,
      splash: 3
    },
    {
      id: "nullbreaker",
      name: "Nullbreaker",
      className: "Relic Weapon",
      description: "A recovered vault relic built to shatter core wardens.",
      min: 16,
      max: 23,
      range: 7,
      magazine: 6,
      cost: 720,
      unlockFloor: 6,
      color: "#f4ede2",
      trait: "Boss hunter",
      critBonus: 0.12,
      closeBonus: 0,
      shots: 1,
      splash: 4
    }
  ];

  const SUPPLIES = [
    {
      id: "ammo-pack",
      name: "Reserve Cell",
      description: "Add 18 rounds to reserve ammunition.",
      cost: 32,
      kind: "ammo",
      amount: 18
    },
    {
      id: "field-patch",
      name: "Field Patch",
      description: "Add one living-fiber healing patch.",
      cost: 44,
      kind: "patch",
      amount: 1
    },
    {
      id: "armor-weave",
      name: "Armor Weave",
      description: "Add six points of protective armor.",
      cost: 58,
      kind: "armor",
      amount: 6
    },
    {
      id: "pulse-charge",
      name: "Pulse Charge",
      description: "Add one crowd-control Echo pulse.",
      cost: 70,
      kind: "pulse",
      amount: 1
    },
    {
      id: "full-repair",
      name: "Full Repair",
      description: "Restore all missing vitality.",
      cost: 95,
      kind: "repair",
      amount: 999
    }
  ];

  function findCharacter(id) {
    return CHARACTERS.find(character => character.id === id) || CHARACTERS[0];
  }

  function findWeapon(id) {
    return WEAPONS.find(weapon => weapon.id === id) || WEAPONS[0];
  }

  root.RiftCatalog = Object.freeze({
    CHARACTERS,
    SUPPLIES,
    WEAPONS,
    findCharacter,
    findWeapon
  });
})(typeof window !== "undefined" ? window : globalThis);
