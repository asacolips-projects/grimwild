export class GrimwildChatMessage extends ChatMessage {
  // /** @inheritDoc */
  // _initialize(options = {}) {
  //   super._initialize(options);
  // }

  /** @inheritDoc */
  async getHTML(...args) {
    const html = await super.getHTML();
    console.log('html', html);
    this._enrichChatCard(html[0]);

    return html;
  }

  /**
   * Augment the chat card markup for additional styling.
   * @param {HTMLElement} html  The chat card markup.
   * @protected
   */
  _enrichChatCard(html) {
    // Header matter
    const { scene: sceneId, token: tokenId, actor: actorId } = this.speaker;
    const actor = game.scenes.get(sceneId)?.tokens.get(tokenId)?.actor ?? game.actors.get(actorId);

    let img;
    let nameText;
    if ( this.isContentVisible ) {
      img = actor?.img ?? this.author.avatar;
      nameText = this.alias;
    } else {
      img = this.author.avatar;
      nameText = this.author.name;
    }

    console.log('CHAT', this);

    const avatar = document.createElement("a");
    avatar.classList.add("avatar");
    if ( actor ) avatar.dataset.uuid = actor.uuid;
    avatar.innerHTML = `<img src="${img}" alt="${nameText}">`;

    const name = document.createElement("span");
    name.classList.add("name-stacked");
    name.innerHTML = `<span class="title">${nameText}</span>`;

    const subtitle = document.createElement("span");
    subtitle.classList.add("subtitle");
    if ( this.whisper.length ) subtitle.innerText = html.querySelector(".whisper-to")?.innerText ?? "";
    if ( (nameText !== this.author?.name) && !subtitle.innerText.length ) subtitle.innerText = this.author?.name ?? "";

    name.appendChild(subtitle);

    const sender = html.querySelector(".message-sender");
    if (img !== 'icons/svg/mystery-man.svg') {
      sender?.replaceChildren(avatar, name);
    }
    else {
      sender?.replaceChildren(name);
    }
    html.querySelector(".whisper-to")?.remove();
  }
}