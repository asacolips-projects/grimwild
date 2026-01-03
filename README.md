# Grimwild

![Foundry v13.351](https://img.shields.io/badge/Foundry-v13.351-green)

A FoundryVTT system for the [Grimwild](https://www.odditypress.com/) RPG.

![image](https://github.com/user-attachments/assets/716ae78d-1c81-4b4b-9172-8f05f1b1cd53)

## Installation

The Grimwild system is not yet available in the Foundry package manager, but it can be installed via manifest:

1. Go to Foundry's setup page
2. Go to the **Game Systems** tab
3. Choose **Install System**
4. Paste the following link into the **Manifest URL** field: https://asacolips-artifacts.s3.amazonaws.com/grimwild/latest/system.json
5. Click **Install**

## Updates

The manifest is configured so that Foundry will be able to handle updates. Once the system is installed, just use the check for updates button as you would for any other system.

## Getting Started

The Grimwild system is still in early development, so more features will be coming! Check for updates frequently.

### Actor Types

- **Character**
    - Used for creating character sheets.
    - Most fields are text fields (occasionally with an autocomplete like desires), so edit them as needed.
    - Talents ship with the system and can be dragged and dropped onto character sheets. To view talents for your character's path, go to the talents tab of the sheet and click the **Compendium** button.
- **Monster**
    - Used for creating monster sheets.
    - Has both a basic **Challenge Pool** field (for elites and bosses) and a **Challenges** tab where additional challenges can be created as needed.
    - Traits, moves, and tables are supported based on the structure in the rule book, but their display and rolling isn't fully fleshed out yet.
- **Linked Challenge**
    - Used for creating linked challenges or simple challenges that aren't quite monsters. Similar to the monster sheet, but with less fields.
    - Because this is an actor, it can be dropped on the canvas and assigned a token.
    - We don't yet have a way to show visual links between challenge cards, but that may be added in a future release if we can find a straightforward way to do so.

### Item Types

- **Talent**
    - Talents that can be added to characters.
    - Includes a **description** field for the rules content and a **notes** field for character notes on the talent, like what spell theorems were selected.
    - The **Attributes** tab includes a **Trackers** section where various trackers for the talents can be created. We've pre-created these for all of the talents in the book, but there are two types: pool and points. Points can be displayed as either a row of checkbox (such as spell slots) or as a number input.
- **Challenge**
    - Singular challenges that can be embedded in either Linked Challenge actors or Monster actors. Usually you would create these directly on the Linked Challenge or Monster, but you can also create them by themselves so that they can be dragged and dropped into either actors or into journal entries for your session notes.
- **Arcana**
    - Not much to these yet, but the item type has been created so that you can start creating them by name/image.

## Rolls

Rolls can be generated directly from character and monster sheets, or you can roll them in chat with the following syntax:

- `/r 4d` - Roll a 4 dice roll.
- `/r 4d2t` - Roll a 4 dice roll with 2 thorns.
- `/r 4p` - Roll a 4 dice pool. This isn't tracked anywhere, but it will note how the pool should change in the result.

### Marks and Harm

Any rolls that include a Messy, Grim, or Disaster result will have buttons on them to apply marks, Bloodied, or Rattled. Clicking one of the buttons will apply that kind of harm to the character associated with your account, or to the currently selected character token if you have multiple.

### Dice So Nice

The system includes support for Dice So Nice. A custom texture with color-coded results is included with the name `grimwild`. There's also a system setting in the Grimwild section of the world's settings that will allow each user to choose whether or not they want to always use the Grimwild dice instead of other Dice So Nice textures for Grimwild rolls and pools specifically.

### Dice Tray

An integration for the Dice Tray module is in progress! Keep an eye out for updates to it, and this readme will be updated once it's available.

## GM Tools

### Suspense

A suspense tracker will appear directly above the Macro Bar. This is a global tracker and you can control in the system's settings whether or not its visible to players.

### Quick Pools

To the right of the suspense tracker, GMs can create quick pools. The quick pools are unique to each Foundry scene. As with suspense, GMs can control whether or not these are visible to players, but individual quick pools can also be shown/hidden.

## Licenses

See LICENSE.md for full details.

### Content Licenses

Grimwild © 2024 by J.D. Maxwell and Oddity Press, licensed under CC BY 4.0.
Grimwild is based on Moxie © 2024 by J.D. Maxwell and Oddity Press, licensed under CC BY 4.0.

Compendium content from Grimwild is used with permission from Oddity Press.

### Image Licenses

Logos and page textures in the assets/ directory are © 2024 by Oddity Press and used with permission.