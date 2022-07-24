import { LightningElement } from 'lwc';

export default class ParentTable extends LightningElement {
    handleLookupRecordSelection(e)
    {
        console.log(JSON.stringify(e));
    }
}
