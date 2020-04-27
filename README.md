# Custom Critical Hits 5e
A FoundryVTT module to allow customisation of critical hit behaviour for the [D&amp;D 5e game system](https://gitlab.com/foundrynet/dnd5e).

### Default Rule
You can change the default rule for critical hit damage in the module settings menu.

### Actor Rule
You can customise the rule used for a specific actor in the **Feats** section an Actor's **Special Traits** page (on the character sheet). This could be used for implementing a different critical rule for PCs vs NPCs, or for enhancing a specific character's critical hit.

### Supported Rules
#### Roll Double Dice (RAW)
> When you score a critical hit, you get to roll extra dice for the attack’s damage against the target. Roll all of the attack’s damage dice twice and add them together. Then add any relevant modifiers as normal. To speed up play, you can roll all the damage dice at once. (PHB, p. 196)

#### Maxed Dice + Rolled Dice + Modifiers
When you score a critical hit, sum the maximsed values of each dice, and add this to the damage of the normal roll.

E.g. if your normal attack damage is `1d8 + 4`, a critical hit will do `8 + 1d8 + 4` damage instead.

This is a popular house rule that ensures critical hits never do less damage than a normal attack could.
