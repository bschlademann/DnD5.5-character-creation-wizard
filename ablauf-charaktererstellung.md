# Character Creation Flow (D&D 5e 2024)

Character creation proceeds step by step in a sensible order. Each step is its own section in the builder. The player is guided through the steps but can always go back and change decisions already made.

source is 5e.tools.
only these books are allowed:
- Eberron: Forge of the Artificer
- Player's Handbook 2024

## Overview of Steps

- **Determine Ability Scores** standard-array: (15, 14, 13, 12, 10,8)
- **Choose Species**
- select subspecies, add everything the species brings to the cahracter sheet on the corresponding tabs (spells, cantrips, resistances, and so on) 
**Choose Class**
- select skill proficiencies from the class skill array, number of selections and content of the array depend on the class
**Choose Background**
choose: 
- either select from the backgrounds
or
- free choice of where to place the +2/+1, which origin feat and 2 skill and 1 tool proficiencies)
**Weapons, Armor & Equipment**
let the player select which standart-layout the want
**Spells & Preparation**
selection depends on the spelllist of the class
**Summary & Character Sheet**
- interactive summary, proficiencies / expertise, ability scores, etc are interactive and the calculations are made on the fly
- option to export the character sheet as pdf

---

## Step 2: Choose Class

The class is the central step and influences almost everything else.

- Pick from the 12 classes (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard).
- Display key info per class:
  - Hit Dice (Hit Points)
  - Primary ability
  - Saving throws
  - Proficiencies (weapons, armor, skills)
  - Starting equipment
  - Core features at level 1
- The choice remains freely changeable at this point; the class is only locked in when the player moves on.

## Step 3: Choose Species

- Pick from the species (Human, Elf, Dwarf, Halfling, Dragonborn, Gnome, Half-Orc, Tiefling, Goliath, Aarakocra, Aasimar, Genasi, Gith, etc.).
- Display features:
  - Size, movement speed
  - Ability score bonus
  - Species features (Darkvision, senses, etc.)
  - Starting languages
- Note: The species bonus is applied automatically in Step 5.

## Step 4: Choose Background

- Pick from the 2024 backgrounds (e.g. Acolyte, Criminal, Guard, Sage, Soldier, Noble, Artisan, Charlatan, Entertainer, Farmer, Hermit, Merchant, Sailor, Scribe, Wayfarer, Guide).
- Each background grants:
  - 3 skill proficiencies (2 of them chooseable)
  - 1 tool proficiency
  - 1 feat at level 1
  - Background feature
- The feat bonus from the background is accounted for in Step 6.

## Step 5: Determine Ability Scores

- Three methods to choose from:
  1. **Point Buy** – spend 27 points across the 6 scores (standard-array values 8–15)
  2. **Standard Array** – 15, 14, 13, 12, 10, 8
  3. **Rolling** (3d6 / 4d6-drop-lowest) – with the option to reroll multiple times
- The 6 scores: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.
- Assignment via drag & drop or random distribution.
- Automatic calculation:
  - Ability modifiers (modifier = (score - 10) / 2, rounded down)
  - Apply species bonus (Step 3)
  - Max HP from hit dice + Constitution modifier
  - Saving throws from class (Step 2) + corresponding scores

## Step 6: Choose Feats & Skills

- **Skill proficiencies**: Select which skills from the list the character is proficient in (based on class + background).
- **Tool proficiencies**: Select matching the background/class.
- **Languages**: Choose additional languages (Intelligence bonus = number of extra languages, optional).
- **Feat**: The background feat bonus is selected concretely here (list of 2024 feats).
- Display the final skill list with automatically calculated bonuses (skill bonus = ability modifier + proficiency bonus, expertise doubles it).

## Step 7: Weapons, Armor & Equipment

- **Class starting equipment** preselected.
- **Alternative**: Build custom equipment from a gold pool (gold from the background/class).
- **Weapons**: Choose melee/ranged; automatic calculation of attack bonus and damage.
- **Armor**: Light/medium/heavy armor + shield – only selectable if the class is proficient; automatic AC calculation including armor + Dexterity modifier (with armor limits).
- **Additional equipment**: Tools, focus, basic gear, pouch, etc.

## Step 8: Spells & Preparation

- Only visible for spellcasting classes; otherwise skipped.
- Display the spell overview: cantrips, spell slots, known/prepared spells at level 1.
- Select **cantrips** and **known spells** (spellcaster classes) or **prepared spells** (Cleric, Druid, Paladin, Ranger).
- Note on the class's spellcasting ability (e.g. Intelligence for Wizard, Wisdom for Cleric).
- Automatic calculation of spell save DC and attack bonus.

## Step 9: Details & Personality

- Name (final choice)
- Appearance: height, weight, age, eye, hair and skin color, portrait (optional image upload)
- Personality: personality traits, ideals, bonds, flaws (suggested from the background)
- Alignment (optional)
- Backstory (free text, optional)
- Deity/faith (optional, relevant for Clerics/Paladins)

## Step 10: Summary & Character Sheet

- Full summary of all decisions made as a preview.
- Display the final **character sheet**:
  - Ability scores & modifiers
  - HP, AC, Speed, Initiative
  - Attacks & damage
  - Skills with bonuses, saving throws
  - Proficiencies (weapons, armor, tools)
  - Spell list & slots
  - Equipment & money
  - Personality & backstory
- Options:
  - "Back" to any step
  - Save locally as a file (JSON)
  - Export as PDF / printable character sheet
  - Duplicate character for variants

---

## General Builder Rules

- **Progressive disclosure**: Each step shows only relevant options; complex rules are simplified or explained with tooltips.
- **Automatic calculation**: Ability scores, HP, AC, skills, attacks and spells update live.
- **Freedom & correction**: No decision is irreversible; every step can be changed at any time.
- **Recommendations**: "Recommended" hints are shown for beginners (e.g. Standard Array, pre-made builds).
- **Validation**: On completing each step, it is checked that all required information is present.
