import { isMentalStat, isPhysicalStat } from "../helpers/config.mjs";

const { renderTemplate } = foundry.applications.handlebars;

export class GrimwildConfigurationRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-action-config.hbs";

	get dice() {
		const fromDefault = this.options.diceDefault;
		const fromSpark = this.options.sparkUsed ?? 0;
		const fromSetup = this.options.isSetup ?? 0;

		return fromDefault + fromSpark + fromSetup;
	}

	get isMarkIgnored() {
		return this.options.isMarked
			&& ((this.options.isBloodied && isPhysicalStat(this.options.stat))
			|| (this.options.isRattled && isMentalStat(this.options.stat)));
	}

	get thorns() {
		const fromDifficulty = this.options.isPotent ? 0 : this.options.difficulty;
		const fromMarked = this.options.isMarked && !this.isMarkIgnored ? 1 : 0;
		const fromBloodied = this.options.isBloodied ? 1 : 0;
		const fromRattled = this.options.isRattled ? 1 : 0;
		const fromVex = this.options.isVex ? 1 : 0;
		const fromConditions = this.options.conditionsApplied?.length ?? 0

		return fromDifficulty + fromMarked + fromBloodied + fromRattled + fromVex + fromConditions;
	}

	get assistMessages() {
        return game.messages.filter(message => message.rolls[0]?.options.rollMessageId == this.options.chatMessageId);
	}

	get assistants() {
        return this.assistMessages.map(message => game.actors.get(message.rolls[0]?.options.actorId));
	}

	get assistingActor() {
		const owner = game.actors.get(this.options.actorId);
		const actor = canvas.tokens?.controlled.length == 1 && canvas.tokens?.controlled[0]?.actor.type === "character"
			? canvas.tokens?.controlled[0].actor
			: !game.user.isGM ? game.user.character : undefined;

		return owner !== actor && !this.assistants.includes(actor) ? actor : undefined;
	}

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		const isOwner = game.actors.get(this.options.actorId)?.isOwner;
		const assistingActor = this.assistingActor;

		const chatData = {
			...this.options,
			rolled: false,
			isPrivate,
			isGM: game.user.isGM,
			isOwner,
			assistingActor,
			hasAssistingActor: !!assistingActor
		};
		return renderTemplate(template, chatData);
	}
}

export class GrimwildAssistRoll extends Roll {
	static CHAT_TEMPLATE = "systems/grimwild/templates/chat/roll-action-assist.hbs";

	async render({ flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false }={}) {
		const isOwner = game.actors.get(this.options.actorId)?.isOwner;
		const targetMessageId = this.options.rollMessageId;
		const assistingActorId = this.options.actorId;

		const targetMessage = game.messages.get(targetMessageId);
		const targetRollOptions = targetMessage?.rolls[0]?.options;
		const rollingActorId = targetRollOptions?.actorId;

		const assistingActor = game.actors.get(assistingActorId);
		const rollingActor = game.actors.get(rollingActorId);

		const chatData = {
			isPrivate,
			dice: this.dice[0]?.results,
			assistingActor,
			rollingActor,
			targetRollOptions,
			isOwner
		};
		return renderTemplate(template, chatData);
	}
}
