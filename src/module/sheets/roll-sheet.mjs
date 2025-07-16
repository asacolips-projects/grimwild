import { isMentalStat, isPhysicalStat } from "../helpers/config.mjs";

const { api, sheets } = foundry.applications;

export class GrimwildRollSheet extends api.HandlebarsApplicationMixin(
	sheets.ItemSheetV2
) {
	static DEFAULT_OPTIONS = {
		id: "configure-roll-form",
		form: {
			handler: GrimwildRollSheet.#onSubmit,
			closeOnSubmit: false,
			submitOnChange: true
		},
		position: {
			width: 640,
			height: "auto"
		},
		tag: "form",
		window: {
			icon: "fas fa-dice-d6",
			contentClasses: ["standard-form"]
		},
		actions: {
			performRoll: GrimwildRollSheet.performRoll
		}
	};

	static PARTS = {
		main: {
			template: "systems/grimwild/templates/chat-message/stat-roll.hbs"
		}
	};

	get title() {
		return "Grimwild Roll";
	}

    _insertElement(element) {
        super._insertElement(element);

        // Rerender if assist messages are created or deleted
        this.createChatMessageHook = Hooks.on("createChatMessage", (message, options, user) => {
            if (message.rolls[0]?.options.rollMessageId) {
                this.render(true);
            }
        });
        this.deleteChatMessageHook = Hooks.on("deleteChatMessage", (message, options, user) => {
            if (message.rolls[0]?.options.rollMessageId) {
                this.render(true);
            }
        });
    }

    async close(options) {
        super.close(options);

        Hooks.off("createChatMessage", this.createChatMessageHook);
        Hooks.off("deleteChatMessage", this.deleteChatMessageHook);
    }

	_prepareContext(options) {
        const roll = this.document.rolls[0]
		const sparkArray = Array.from({ length: roll.options.spark }, (_, i) => i);
        const conditionArray = roll.options.conditions?.map((condition, index) => ({
            condition,
            isSelected: roll.options.conditionsApplied?.includes(index)
        }));
        const markIgnored = roll.isMarkIgnored
        const assistants = roll.assistants;

        const totalDice = roll.dice;
        const totalThorns = roll.thorns;

		return { ...roll.options, sparkArray, conditionArray, markIgnored, assistants, totalDice, totalThorns };
	}

	_onRender(context, options) {}

	static performRoll() {
		this.close();
		this.document.performRoll();
	}

	static async #onSubmit(event, form, formData) {
		const data = foundry.utils.expandObject(formData.object);
		data.sparkUsed = data.sparkUsed ? Object.values(data.sparkUsed).reduce((acc, cur) => acc + (cur ? 1 : 0), 0) : 0;
		data.conditionsApplied = data.conditionsApplied ? Object.entries(data.conditionsApplied).filter(([key, value]) => value).map(([key, value]) => parseInt(key)) : [];
		const diff = foundry.utils.diffObject(this.document.rolls[0].options, data);

		this.document.rolls[0].options = Object.assign(this.document.rolls[0].options, diff);
		this.document.update({ rolls: this.document.rolls });
	}
}
