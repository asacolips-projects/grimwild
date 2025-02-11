function createSuspense() {
    game.settings.register("grimwild", "suspense", {
        name: "Suspense",
        scope: "world",
        config: false,
        type: Number,
        default: 0,
        range: {
            min: 0
        }
    });
}

function getSuspense() {
    return game.settings.get("grimwild", "suspense");
}

function setSuspense(value) {
    game.settings.set("grimwild", "suspense", value);
}

class SuspenseTracker {
    constructor(){}

    suspense = 0;
    updateCallbacks = new Array();

    addUpdateCallback(fn){
        this.updateCallbacks.push(fn);
    }

    #onUpdate() {
        this.updateCallbacks.forEach(fn =>{
            try {
                fn(this.suspense);
            } catch (exception) {
                // just log, don't interrupt
                console.log(exception);
            }
        });
    }

    adjust(amount) {
        const prev = this.suspense;
        this.suspense += amount;
        if (this.suspense < 0) this.suspense = 0;
        if (this.suspense != prev) {
            this.#onUpdate();
        }
    }

    init() {
        console.log("Suspense: initialising");
        createSuspense();
        this.suspense = getSuspense();
        this.#onUpdate();
        this.addUpdateCallback(setSuspense);
        console.log("Suspense: initialised with value " + this.suspense);
    }

    render() {
        const trackerHotBar = document.createElement("div");
        trackerHotBar.classList.add("suspense-controls");
        trackerHotBar.innerHTML = `
        <div id="sus-control-inner">
            <div id="sus-display">
                <div id="js-sus-current">${this.suspense}</div>
                <div id="sus-label">SUSPENSE</div>
            </div>
            <div id="sus-adjust">
                <button id="js-sus-up">+</button>
                <button id="js-sus-dn">-</button>
            </div>
        </div>
        `;
        document.getElementById("ui-bottom").prepend(trackerHotBar);

        document.getElementById("js-sus-up").onclick = () => this.adjust(1);
        document.getElementById("js-sus-dn").onclick = () => this.adjust(-1);

        const currentSuspenseDisplay = document.getElementById("js-sus-current");
        this.addUpdateCallback(suspense => {
            currentSuspenseDisplay.innerText = suspense;
        });
    }
}

export const SUSPENSE_TRACKER = new SuspenseTracker();