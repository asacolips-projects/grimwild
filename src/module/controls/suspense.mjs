function getSuspense() {
    return game.settings.get("grimwild", "suspense");
}

function setSuspense(value) {
    game.settings.set("grimwild", "suspense", value);
}

class SuspenseTracker {
    constructor(){}

    init() {
        console.log("Suspense: initialising");
        game.settings.register("grimwild", "suspenseVisible", {
            name: "Suspense visible to players",
            hint: "Toggle this on/off to show/hide the suspense tracker for non-GMs",
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: this.render
        });
        game.settings.register("grimwild", "suspense", {
            name: "Suspense",
            scope: "world",
            config: false,
            type: Number,
            default: 0,
            onChange: this.render
        });
    }

    render() {
        const isGM = game.user.isGM;
        const visibleToPlayers = game.settings.get("grimwild", "suspenseVisible");

        let susControl = document.getElementById("sus-control");

        if (!isGM && !visibleToPlayers) {
            if (susControl) susControl.innerHTML = "";
            return;
        }

        const buttonHtml = `
        <div id="sus-adjust">
            <button id="js-sus-up">+</button>
            <button id="js-sus-dn">-</button>
        </div>`;

        const susControlInnerHTML = `
        <div id="sus-control-inner">
            <div id="sus-display">
                <div id="sus-current">${getSuspense()}</div>
                <div id="sus-label">SUSPENSE</div>
            </div>
            ${isGM ? buttonHtml : ""}
        </div>`;

        if (!susControl) {
            susControl = document.createElement("div");
            susControl.setAttribute("id", "sus-control");
            document.getElementById("ui-bottom").prepend(susControl);
        }
        susControl.innerHTML = susControlInnerHTML;

        if (isGM) {
            document.getElementById("js-sus-up").onclick = () => setSuspense(getSuspense() + 1);
            document.getElementById("js-sus-dn").onclick = () => {
                setSuspense(Math.max(getSuspense() - 1, 0));
            };
        }
    }
}

export const SUSPENSE_TRACKER = new SuspenseTracker();