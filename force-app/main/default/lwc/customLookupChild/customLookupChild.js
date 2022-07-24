import { api, LightningElement } from 'lwc';
import search from '@salesforce/apex/CustomLookupController.search';
import fetch from '@salesforce/apex/CustomLookupController.fetch';
/**
 * This component is reusable to show any type of lookup wih filters
 */
export default class CustomLookup extends LightningElement {

    __objectName;
    __whereClause;
    __mainFieldToShow;
    __addnFieldToShow;
    __numberOfResults;
    __iconName;
    __rowIdentifier;


    @api
    get objectName() {
        return this.__objectName;
    }
    set objectName(val) {
        this.__objectName = val;
        this.validateSetup();
    }
    @api
    get whereClause() {
        return this.__whereClause;
    }
    set whereClause(val) {
        this.__whereClause = val;
        this.validateSetup();
    }
    @api
    get mainFieldToShow() {
        return this.__mainFieldToShow;
    }
    set mainFieldToShow(val) {
        this.__mainFieldToShow = val;
        this.validateSetup();
    }
    @api
    get addnFieldToShow() {
        return this.__addnFieldToShow;
    }
    set addnFieldToShow(val) {
        this.__addnFieldToShow = val;
        this.validateSetup();
    }
    @api
    get numberOfResults() {
        return this.__numberOfResults;
    }
    set numberOfResults(val) {
        this.__numberOfResults = val;
        this.validateSetup();
    }
    @api
    get iconName() {
        return this.__iconName;
    }
    set iconName(val) {
        this.__iconName = val;
        this.validateSetup();
    }
    @api
    get rowIdentifier() //optional - to be only used when used inside a tabl()
    {
        return this.__rowIdentifier;
    }
    set rowIdentifier(val) {
        this.__rowIdentifier = val;
        this.validateSetup();
    }

    searchTerm;
    results;
    showResults;
    timeOutVar;
    selectedId;
    selectedName;
    invalidSetup;
    /**
     * formats the results into a generic list 
     * with parameters like mainfieldtoshow and addnfieldtoshow
     */
    get resultsToShow() {

        let resultsLocal = this.results.map(item => {
            item.mainFieldToShow = item[this.mainFieldToShow];
            item.addnFieldToShow = item[this.addnFieldToShow];
            return item;
        });
        return resultsLocal;
    }
    get isResultsAvailable() {
        if (this.results && this.results.length > 0) {
            return true;
        }
        return false;
    }
    get inputDivClass() {
        return this.optionSelected ?
            'slds-combobox__form-element slds-input-has-icon slds-input-has-icon_left-right' :
            'slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right';
    }
    get searchResultDivClass() {
        return this.showResults ?
            'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' :
            'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    }
    get formattedQuery() {
        if (this.searchTerm == undefined) {
            this.searchTerm = '';
        }
        if (this.searchTerm == '') {
            let q = 'SELECT Id,';
            q += this.mainFieldToShow;
            if (this.hasAddnField) {
                q += ',' + this.addnFieldToShow;
            }
            q += ' from ';
            q += this.objectName;
            if (this.whereClause) {
                q += ' where ';
                q += this.whereClause;
            }
            q += ' limit ' + this.numberOfResults;
            return q;
        } else {
            let q = 'FIND \'';
            q += this.searchTerm;
            q += '\' IN ALL FIELDS RETURNING ';
            q += this.objectName;
            q += '(Id,' + this.mainFieldToShow;
            if (this.hasAddnField) {
                q += ',' + this.addnFieldToShow;
            }
            if (this.whereClause) {
                q += ' WHERE ';
                q += this.whereClause;
            }
            q += ')';
            q += ' limit ' + this.numberOfResults;
            return q;
        }
    }
    get hasAddnField() {
        return !this.isNullOrUndefinedOrBlankOrZero(this.addnFieldToShow);
    }
    get optionSelected() {
        return this.selectedId != undefined && this.selectedId != '' && this.selectedId != null;
    }
    connectedCallback() {
        this.validateSetup();
        if (!this.invalidSetup) {
            this.__mouseUpListener = this.mouseUpListener.bind(this);
            window.addEventListener('click', this.__mouseUpListener);
            this.showResults = false;
            this.fetchResults();
        }
    }
    mouseUpListener() {
        console.log('logged in func');
        if (this.timeOutVar) {
            clearTimeout(this.timeOutVar);
        }
        this.showResults = false;
    }
    validateSetup() {
        if (this.isNullOrUndefinedOrBlankOrZero(this.objectName)
            || this.isNullOrUndefinedOrBlankOrZero(this.mainFieldToShow)
            || this.isNullOrUndefinedOrBlankOrZero(this.numberOfResults)
            || this.isNullOrUndefinedOrBlankOrZero(this.iconName)) {
            console.log("SETUP INVALID");
            this.invalidSetup = true;
        }
        else {
            this.invalidSetup = false;
        }
    }
    /**
     * 
     * @param {event} e 
     * selects the record
     * passes the selected record to parent
     * closes the results
     */
    handleSelection(e) {
        e.preventDefault();
        e.stopPropagation();
        let selectedId = e.currentTarget.getAttribute('data-id');
        let selectedName = e.currentTarget.getAttribute('data-var');

        this.selectedId = selectedId;
        this.selectedName = selectedName;

        let evt = new CustomEvent('lookupvalueselected', {
            detail: {
                'selectedId': selectedId,
                'rowIdentifier': this.rowIdentifier
            }
        });
        this.dispatchEvent(evt);
        this.showResults = false;
    }
    removeSelection(e) {
        e.preventDefault();
        e.stopPropagation();
        this.selectedId = null;
        let evt = new CustomEvent('lookupvalueselected', {
            detail: {
                'selectedId': null,
                'rowIdentifier': this.rowIdentifier
            }
        });
        this.dispatchEvent(evt);
        this.showResults = false;
    }
    handleClickOnInput(e) {
        e.preventDefault();
        e.stopPropagation();
        this.showResults = true;
    }
    handleSearchTermChange(e) {
        let searchTerm = e.target.value;
        console.log('mouseup' + searchTerm);
        this.searchTerm = searchTerm;
        if (this.timeOutVar) {
            clearTimeout(this.timeOutVar);
        }
        this.__fetchResults = this.fetchResults.bind(this);
        this.timeOutVar = setTimeout(
            this.__fetchResults, 300);
    }
    fetchResults() {
        console.log('fetch called');
        if (this.searchTerm == '' || this.searchTerm == undefined) {
            fetch({ 'query': this.formattedQuery, 'objectName': this.objectName })
                .then(result => {
                    console.log(result);
                    let resultVar = JSON.parse(result);
                    this.results = resultVar.returnValue.searchResults;
                })
                .catch(error => {
                    console.log(error);
                });
        } else if (this.searchTerm.length > 1) {
            search({ 'query': this.formattedQuery, 'objectName': this.objectName })
                .then(result => {
                    console.log(result);
                    let resultVar = JSON.parse(result);
                    this.results = resultVar.returnValue.searchResults;
                })
                .catch(error => {
                    console.log(error);
                });
        }
    }
    isNullOrUndefinedOrBlankOrZero(val) {
        return val == undefined || val == null || val == '' || val == 0;
    }
}
