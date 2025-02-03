export class GrimwildRollDialog extends foundry.applications.api.DialogV2 {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        actions: {

        }
    };

    _getDialogElement() {
        return document.querySelector('#grimwild-roll-dialog');
    }

    static async addAssist() {
        const row = document.createElement('div');
        row.classList.add('grimwild-form-group');
        
        const textInput = document.createElement('input');
        textInput.classList.add('assist-name');
        textInput.type = 'text';
        textInput.name = 'textInput[]';
        textInput.placeholder = 'Name';

        const numberInput = document.createElement('input');
        numberInput.classList.add('assist-value');
        numberInput.type = 'number';
        numberInput.name = 'numberInput[]';
        numberInput.value = 0;
        numberInput.setAttribute('data-action-input', 'updateDiceTotal');

        const container = this._getDialogElement().querySelector('#assistContainer');

        row.appendChild(textInput);
        row.appendChild(numberInput);
        container.appendChild(row);
    }

    _render(event, html) {
        this._updateThornsTotal();
        this._updateDiceTotal();
    }

    static async _updateThornsTotal(event, target) {
        const checkboxes = this._getDialogElement().querySelectorAll('.thornCheck');
        const numbers = this._getDialogElement().querySelectorAll('.thornInput');
        const checkTotal = Array.from(checkboxes).reduce((sum, checkbox) => sum + (checkbox.checked ? 1 : 0), 0);
        const numTotal = Array.from(numbers).reduce((sum, number) => sum + parseInt(number.value || 0, 10), 0);
        this._getDialogElement().querySelector('#totalThorns').textContent = numTotal + checkTotal;
    }

    static async _updateDiceTotal(event, target) {
        const assists = this._getDialogElement().querySelectorAll('.assist-value');
        const assistTotal = Array.from(assists).reduce((sum, assist) => sum + parseInt(assist.value || 0, 10), 0);
        const stat = this._getDialogElement().querySelector('#stat');
        const statTotal = parseInt(stat.value || 0, 10);
        this._getDialogElement().querySelector('#totalDice').textContent = assistTotal + statTotal;
    }


}