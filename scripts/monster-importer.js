// scripts/monster-importer.js

import { parseMonsters } from "./monsterParser.js";
import { buildItems } from "./builders/buildItems.js";
import { parseMaliceText } from "./officialMaliceParsers/maliceParser.js";

class MonsterImportUI extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "monster-importer",
      title: "Import Monster",
      template: "modules/draw-steel-monster-importer/templates/monster-importer-ui.html",
      width: 500,
      height: "auto",
      resizable: true,
      classes: ["draw-steel", "monster-importer"]
    });
  }

  getData() {
    return {};
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#import-button").on("click", () => this._importMonster());
  }

  async _importMonster() {
    try {
      const rawText = document.querySelector("#monster-text")?.value ?? "";
      const maliceText = document.querySelector("#malice-text")?.value ?? "";
      const folderName = document.querySelector("#monster-folder")?.value?.trim();

      if (!rawText) {
        ui.notifications.warn("No text provided for import.");
        return;
      }

      // Parse every monster stat block found in the pasted text (a
      // single monster still comes back as a one-element array).
      const monsters = await parseMonsters(rawText);

      // Parse malice abilities ONCE — shared across every monster below.
      let maliceAbilities = [];
      if (maliceText.trim().length > 0) {
        const parsed = parseMaliceText(maliceText);
        maliceAbilities = parsed.items ?? [];
      }

      // Create folder if needed
      let folderId = null;
      if (folderName) {
        let folder = game.folders.find(f => f.name === folderName && f.type === "Actor");
        if (!folder) {
          folder = await Folder.create({
            name: folderName,
            type: "Actor",
            color: "#4b4a44"
          });
        }
        folderId = folder.id;
      }

      const createdNames = [];

      for (const { actorData, features, abilities } of monsters) {
        const highestCharacteristic = (() => {
          const chars = actorData.system?.characteristics || {};
          const entries = Object.entries(chars);
          if (!entries.length) return "none";
          entries.sort((a, b) => b[1] - a[1]);
          return entries[0][0];
        })();

        const items = buildItems(features, abilities, {
          ...actorData.system,
          highestCharacteristic
        });

        // Each actor gets its own deep-cloned copy of the shared malice
        // items — reusing the same object reference across multiple
        // Actor.create() calls would let Foundry's ID assignment for one
        // actor bleed into the next.
        if (maliceAbilities.length > 0) {
          items.push(...foundry.utils.deepClone(maliceAbilities));
        }

        const actor = await Actor.create({
          ...actorData,
          items,
          folder: folderId
        });

        createdNames.push(actor.name);
      }

      ui.notifications.info(
        createdNames.length === 1
          ? `Imported: ${createdNames[0]}`
          : `Imported ${createdNames.length} monsters: ${createdNames.join(", ")}`
      );
      this.close();

    } catch (err) {
      console.error("Monster Importer Error:", err);
      ui.notifications.error("Failed to import monster. Check console for details.");
    }
  }
}

Hooks.on("renderActorDirectory", (app, element, data) => {
  const html = $(element);
  const footer = html.find(".directory-footer");

  const button = $(`<button class="monster-importer-button">
    <i class="fas fa-file-import"></i> Import Monster
  </button>`);

  button.on("click", () => new MonsterImportUI().render(true));
  footer.append(button);
});