// scripts/monster-importer.js

import { parseMonster } from "./monsterParser.js";
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

      // Parse the monster (header, features, abilities, actorData)
      const { actorData, features, abilities } = await parseMonster(rawText);

      // Parse malice abilities ONLY if the malice block is not empty
      let maliceAbilities = [];
      if (maliceText.trim().length > 0) {
        const parsed = parseMaliceText(maliceText);
        maliceAbilities = parsed.items ?? [];
      }

      // Build Foundry items from parsed data
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

      // Append malice abilities (if any)
      if (maliceAbilities.length > 0) {
        items.push(...maliceAbilities);
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

      // Create the actor
      const actor = await Actor.create({
        ...actorData,
        items,
        folder: folderId
      });

      ui.notifications.info(`Imported: ${actor.name}`);
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