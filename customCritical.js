import { Dice5e } from "../../systems/dnd5e/module/dice.js";

const CRIT_RULES = {
  RAW: "Roll Double Dice (RAW)",
  "Max+Roll": "Maxed Dice + Rolled Dice + Modifiers",
};

const CRIT_FUNCTIONS = {
  RAW: (parts, data) => {
    let roll = new Roll(parts.join("+"), data);
    roll.alter(0, 2);
    return roll;
  },
  "Max+Roll": (parts, data) => {
    let roll = new Roll(parts.join("+"), data).roll();
    let maxedDice = roll.parts
      .filter((p) => {
        return p instanceof Die;
      })
      .map((d) => {
        return d.faces * d.rolls.length;
      })
      .reduce((sum, val) => {
        return sum + val;
      });
    let newParts = [maxedDice, ...parts];
    return new Roll(newParts.join("+"), data);
  },
};

export class CustomCritical {
  /**
   * A standardized helper function for managing core 5e damage rolls
   *
   * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
   * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
   *
   * @param {Event|object} event    The triggering event which initiated the roll
   * @param {Array} parts           The dice roll component parts, excluding the initial d20
   * @param {Actor} actor           The Actor making the damage roll
   * @param {Object} data           Actor or item data against which to parse the roll
   * @param {String} template       The HTML template used to render the roll dialog
   * @param {String} title          The dice roll UI window title
   * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
   * @param {string} flavor         Flavor text to use in the posted chat message
   * @param {Boolean} critical      Allow critical hits to be chosen
   * @param {Function} onClose      Callback for actions to take when the dialog form is closed
   * @param {Object} dialogOptions  Modal dialog options
   *
   * @return {Promise}              A Promise which resolves once the roll workflow has completed
   */
  static async damageRoll({
    event = {},
    parts,
    actor,
    data,
    template,
    title,
    speaker,
    flavor,
    critical = true,
    onClose,
    dialogOptions,
  }) {
    // Handle input arguments
    flavor = flavor || title;
    speaker = speaker || ChatMessage.getSpeaker();
    let rollMode = game.settings.get("core", "rollMode");
    let rolled = false;

    // Define inner roll function
    const _roll = function (parts, crit, form) {
      data["bonus"] = form ? form.bonus.value : 0;

      let roll = new Roll(parts.join("+"), data);

      console.log(actor.getFlag("dnd5e", "criticalHitDamageRule"));

      // Modify the damage formula for critical hits
      if (crit === true) {
        let critRule = actor.getFlag("dnd5e", "criticalHitDamageRule");
        let critFunc;
        if(critRule == "Default") {
          critFunc = CRIT_FUNCTIONS[game.settings.get("custom-critical-5e", "defaultRule")]
        } else {
          critFunc = CRIT_FUNCTIONS[critRule]
        }
        roll = critFunc(parts, data); // Override the Roll with the new crit Roll

        let add = actor && actor.getFlag("dnd5e", "savageAttacks") ? 1 : 0;
        roll.alter(add, 1);
        flavor = `${flavor} (Critical)`;
      }

      // Convert the roll to a chat message
      rollMode = form ? form.rollMode.value : rollMode;
      roll.toMessage(
        {
          speaker: speaker,
          flavor: flavor,
        },
        { rollMode }
      );
      rolled = true;
      return roll;
    };

    // Modify the roll and handle fast-forwarding
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
      return _roll(parts, event.altKey);
    else parts = parts.concat(["@bonus"]);

    // Render modal dialog
    template = template || "systems/dnd5e/templates/chat/roll-dialog.html";
    let dialogData = {
      formula: parts.join(" + "),
      data: data,
      rollMode: rollMode,
      rollModes: CONFIG.rollModes,
    };
    const html = await renderTemplate(template, dialogData);

    // Create the Dialog window
    let roll;
    return new Promise((resolve) => {
      new Dialog(
        {
          title: title,
          content: html,
          buttons: {
            critical: {
              condition: critical,
              label: "Critical Hit",
              callback: (html) =>
                (roll = _roll(parts, true, html[0].children[0])),
            },
            normal: {
              label: critical ? "Normal" : "Roll",
              callback: (html) =>
                (roll = _roll(parts, false, html[0].children[0])),
            },
          },
          default: "normal",
          close: (html) => {
            if (onClose) onClose(html, parts, data);
            resolve(rolled ? roll : false);
          },
        },
        dialogOptions
      ).render(true);
    });
  }
}

/**
 * Register settings data.
 */
function registerModuleSettings() {
  game.settings.register("custom-critical-5e", "defaultRule", {
    name: "Default Rule",
    hint: "Set the default rule for critical hit damage.",
    scope: "world",
    config: true,
    type: String,
    default: "RAW",
    choices: CRIT_RULES,
    onChange: (s) => {
      //some callback
    },
  });
}

/**
 * Adds a Critical Hit Damage Rule flag in the Special Traits section of the character sheet.
 */
function addCriticalDamageFlag() {
  CONFIG.DND5E.characterFlags["criticalHitDamageRule"] = {
    name: "Critical Hit Damage Rule",
    hint: "Allow for customised critical damage rules.",
    section: "Feats",
    type: String,
    choices: {
      Default: "Default",
      ...CRIT_RULES,
    },
  };
}

Hooks.on("ready", () => {
  Dice5e.damageRoll = CustomCritical.damageRoll;
  addCriticalDamageFlag();
});

Hooks.once("init", () => {
  registerModuleSettings();
});
