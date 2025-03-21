import { LightningElement, api, track } from 'lwc';
import templateResources from '@salesforce/resourceUrl/targetSimulator';
import MTDpriceuploadformat from '@salesforce/resourceUrl/MTDpriceuploadformat';
//import xlsReader from '@salesforce/resourceUrl/xlsReader';
import { loadScript } from 'lightning/platformResourceLoader';
import LightningConfirm from "lightning/confirm";
import targetFileUpload from '@salesforce/apex/MonthlyTargetSimulator.targetFileUpload';
import getMonthlyInitialTarget from '@salesforce/apex/MonthlyTargetSimulator.getMonthlyInitialTarget';
import getMonthlyActualTarget from '@salesforce/apex/MonthlyTargetSimulator.getMonthlyActualTarget';
import submitMonthlyTarget from '@salesforce/apex/MonthlyTargetSimulator.submitMonthlyTarget';
import submitMonthlyTargetByRM from '@salesforce/apex/MonthlyTargetSimulator.submitMonthlyTargetByRM';
import InsertMTDPrice from '@salesforce/apex/MonthlyTargetSimulator.InsertMTDPrice';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns = [

    { label: 'Product Name', fieldName: 'Product__c', initialWidth: 200, 'isText': false, 'isLabel': true, 'objectName': 'Target_Simulator__c' },
    { label: 'Target (in Tons)', fieldName: 'Initial_Target__c', initialWidth: 140, 'isText': true, 'isLabel': false, 'objectName': 'Target_Simulator__c' },
    { label: 'Price', fieldName: 'Price__c', initialWidth: 100, 'isText': true, 'isLabel': false, 'objectName': 'Target_Simulator__c' },
    { label: 'R05', fieldName: 'Initial_R05__c', initialWidth: 140, 'isText': false, 'isLabel': true, 'objectName': 'Target_Simulator__c' },
    { label: 'Cost', fieldName: 'Cost__c', initialWidth: 100, 'isText': true, 'isLabel': false, 'objectName': 'Target_Simulator__c' },
    { label: 'R25 Value', fieldName: 'R25_Value__c', initialWidth: 140, 'isText': false, 'isLabel': true, 'objectName': 'Target_Simulator__c' },
    { label: 'R30 Value', fieldName: 'R30_Value__c', initialWidth: 140, 'isText': false, 'isLabel': true, 'objectName': 'Target_Simulator__c' }
];
const tab2columns = [
    { label: 'Product Name', fieldName: 'Product__c', styleClass: 'hideHeader', initialWidth: 200, 'objectName': 'Target_Simulator__c' },
    { label: 'Target(in Tons)', styleClass: 'showHeader', fieldName: 'Initial_Target__c', initialWidth: 140, 'isText': true, 'isLabel': false, 'objectName': 'Target_Simulator__c' },
    { label: 'Price', styleClass: 'showHeader', fieldName: 'Price__c', initialWidth: 100, 'objectName': 'Target_Simulator__c' },
    { label: 'Initial R05', rowsapn: 1, fieldName: 'Initial_R05__c', initialWidth: 140, 'isText': false, 'isLabel': true, 'objectName': 'Target_Simulator__c' },
    { label: 'Target(in Tons)', styleClass: 'showHeader', fieldName: 'Actual_Target__c', initialWidth: 140, 'objectName': 'Target_Simulator__c' },
    { label: 'Price', styleClass: 'showHeader', fieldName: 'Actual_Price__c', initialWidth: 100, 'objectName': 'Target_Simulator__c' },
    { label: 'R05', styleClass: 'showHeader', fieldName: 'Actual_R05__c', initialWidth: 140, 'objectName': 'Target_Simulator__c' },
    { label: 'Actuals(in Tons)', styleClass: 'showHeader', fieldName: 'Actual_Tons__c', initialWidth: 140, 'objectName': 'Target_Simulator__c' },
    { label: 'Price', styleClass: 'showHeader', fieldName: 'Sales_Price__c', initialWidth: 100, 'objectName': 'Target_Simulator__c' },
    { label: 'R05', styleClass: 'showHeader', fieldName: 'Sales_R05__c', initialWidth: 140, 'objectName': 'Target_Simulator__c' }
];
let XLS = {};
export default class MontlyTargetSimulator extends LightningElement {
    columns = columns;
    simulatorColumns = tab2columns;
    @track selectedRegion;
    @track selectedSegment;
    @track selectedYear = new Date().getFullYear().toString();
    @track selectedMonth = (new Date().getMonth() + 1).toString();
    @track selectedRegionTab2;
    @track selectedSegmentTab2;
    @track selectedYearTab2 = new Date().getFullYear().toString();
    @track selectedMonthTab2 = (new Date().getMonth() + 1).toString();
    data = [];
    @track hasError = false;
    @track targets;
    isLoading = false;
    @api templatefile = templateResources;
    @api MTDprice = MTDpriceuploadformat;
    @track submitError;
    datatable = false;
    actualTargetDatatable = false;
    recordsToDisplay = [];
    @track filesUploaded = [];
    processedRows = [];
    processedActualTargetRows = [];
    @track rows = [];
    @track csvcolumns = [];
    @track csvdata = [];
    @track error;
    @track price = 0;
    @track intialR05 = 0;
    @track simulatorTraget = 0;
    @track simulatorprice = 0;
    @track simulatorR05 = 0;
    @track actuvaltons = 0;
    @track actuvalprice = 0;
    @track actuvalR05 = 0;
    @track cost = 0;
    @track R25 = 0;
    @track R30 = 0;
    get acceptedCSVFormats() {
        return ['.csv'];
    }
    get regionOptions() {
        return [{ label: "South", value: "South" }, { label: "North", value: "North" }, { label: "West", value: "West" }, { label: "East", value: "East" }];
    }
    get segmentOptions() {
        return [{ label: "Processor", value: "Processor" }, { label: "Distribution", value: "Distribution" }];
    }
    get yearOptions() {
        var today = new Date();
        var before10Years = new Date(today.getFullYear() - 10, 1 - 1, 1);
        console.log('before10Years.....' + before10Years);
        let options = [];
        for (let i = before10Years.getFullYear(); i <= today.getFullYear(); i++) {
            options.push({ label: i.toString(), value: i.toString() });
        }
        return options.reverse();
    }
    get monthOptions() {
        return [{ label: "Jan", value: "1" }, { label: "Feb", value: "2" }, { label: "Mar", value: "3" }, { label: "Apr", value: "4" }, { label: "May", value: "5" }, { label: "Jun", value: "6" }, { label: "Jul", value: "7" }, { label: "Aug", value: "8" }, { label: "Sept", value: "9" }, { label: "Oct", value: "10" }, { label: "Nov", value: "11" }, { label: "Dec", value: "12" }];

    }

    // @track rows = [{ Product__c: 'CLEAR THIN', Initial_Target__c: 2, Price__c: 1, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'CLEAR THICK', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'DIAMANT THIN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'DIAMANT THICK', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'PARSOL GREEN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'PARSOL BRONZE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'PARSOL DARK GREY', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'MIRROR', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'REF LT GOLD', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'REF DARK GREY', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'REF BRONZE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'REF GREEN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'REF S BLUE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'PLANILAQUE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
    // { Product__c: 'COATER', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null }];


    connectedCallback() {
        // Promise.all([
        //     loadScript(this, xlsReader + '/sheetjs/sheetmin.js')
        // ]).then(() => {
        //     XLS = xlsReader;
        // })
        console.log('month' + new Date().getMonth().toString());
    }
    async readFromFile(returnVal) {
        let wb = XLS.read(returnVal, { type: 'base64', WTF: false });
        console.log(this.to_json(wb));
    }
    to_json(workbook) {
        var result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            var roa = XLS.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            if (roa.length) result[sheetName] = roa;
        });
        return JSON.stringify(result, 2, 2);
    }
    renderedCallback() {
        const style = document.createElement('style');
        style.innerText = ".combo-padding > div.slds-form-element__control{padding-left: 0 !important;margin-right: 10px;}";
        //this.template.querySelector('div[attr="lightning-combobox_combobox"]').appendChild(style);
        //this.template.querySelector(".year-combobox").value = new Date().getFullYear();


    }
    createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    getRegionList() {
        // const option = {
        //     label: list.Name,
        //     value: list.Data_Store__c
        // };
        // // this.selectOptions.push(option);
        // this.selectOptions = [...this.selectOptions, option];
        // return option;
        return null;
    }
    handleComboChange(event) {
        var target = event.target;
        var dataId = target.getAttribute("data-id");
        if (dataId === 'Year__c') {
            this.selectedYear = event.target.value;
        } else if (dataId === 'Month__c') {
            this.selectedMonth = event.target.value;
        } else if (dataId === 'Segment__c') {
            this.selectedSegment = event.target.value;
        } else if (dataId === 'Region__c') {
            this.selectedRegion = event.target.value;
        }
        console.log('dataId....' + dataId);
    }
    handleAcutalComboChange(event) {
        var target = event.target;
        var dataId = target.getAttribute("data-id");
        if (dataId === 'Year__c') {
            this.selectedYearTab2 = event.target.value;
        } else if (dataId === 'Month__c') {
            this.selectedMonthTab2 = event.target.value;
        } else if (dataId === 'Segment__c') {
            this.selectedSegmentTab2 = event.target.value;
        } else if (dataId === 'Region__c') {
            this.selectedRegionTab2 = event.target.value;
        }
        console.log('dataId....' + dataId);
    }
    handleSalesPriceChange(event) {
        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");
        this.rows[rowIndex].Sales_Price__c = target.value;
        console.log('An'+this.rows[rowIndex].Sales_Price__c)
        
        this.rows[rowIndex].Sales_R05__c = (this.rows[rowIndex].Actual_Tons__c * this.rows[rowIndex].Sales_Price__c * 400);

        this.processedActualTargetRows = this.rows;
    }
    handleActualPriceChange(event) {
        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");
        this.rows[rowIndex].Actual_Price__c = target.value;

        this.rows[rowIndex].Actual_R05__c = (this.rows[rowIndex].Actual_Target__c * this.rows[rowIndex].Actual_Price__c * 400);

        this.processedActualTargetRows = this.rows;
    }
    handleActualTargetChange(event) {
        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");
        this.rows[rowIndex].Actual_Target__c = target.value;

        this.rows[rowIndex].Actual_R05__c = (this.rows[rowIndex].Actual_Target__c * this.rows[rowIndex].Price__c * 400);
    
        this.processedRows = this.rows;
    
    }
    fetchActualTargetRows() {
        const All_Compobox_Valid = [...this.template.querySelectorAll('.actual-target-combobox')]
            .reduce((validSoFar, input_Field_Reference) => {
                input_Field_Reference.reportValidity();
                return validSoFar && input_Field_Reference.checkValidity();
            }, true);
        console.log('All_Compobox_Valid.....' + All_Compobox_Valid);
        if (All_Compobox_Valid) {
            this.template.querySelector('[data-id="layout-container"]').classList.remove('alignCenter');
            getMonthlyActualTarget({ Region_c: this.selectedRegionTab2, Segment_c: this.selectedSegmentTab2, Year_c: this.selectedYearTab2, Month_c: this.selectedMonthTab2 })
                .then(response => {
                    if (response.length > 0) {
                        console.log('response....' + response);
                        this.rows = response;
                        this.rows = this.rows.map(row => {
                            return {...row,ActualTons : row.Actual_Tons__c==null?'0':Math.round(row.Actual_Tons__c).toLocaleString('en-us'), InitialRO5 : row.Initial_R05__c.toLocaleString('en-us'),
                            ActualR05 : row.Actual_R05__c.toLocaleString('en-us'),InitialTarget:row.Initial_Target__c.toLocaleString('en-us'),Price : Math.round(row.Price__c*10)/10,SalesPrice : Math.round(row.Sales_Price__c*10)/10,
                            Sales_R05__c:Math.round(row.Sales_R05__c),ActualPrice : Math.round(row.Actual_Price__c*10)/10}});
                           
                             
                        this.grandtotal();
                        this.fetchTab2Rows();
                        //function convertStringArrayToIntArray(stringArray) { let intArray = []; for (let i = 0; i < stringArray.length; i++) { intArray.push(parseInt(stringArray[i])); } return intArray; }
                        
                    }
                    else {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Information',
                                message: 'Target not yet updated for the month.',
                                variant: 'info'
                            }),
                        );
                    }
                }).catch(error => {
                    this.isLoading = false;
                    console.log('Hi....');
                    this.submitError = error.body.message;
                    this.hasError = true;
                    console.log('error......' + error.body.message);
                })
        }
        else {
            this.template.querySelector('[data-id="layout-container"]').classList.add('alignCenter');
        }
        
        
    }
    grandtotal() {
        this.targets = this.rows.reduce((total,item)=>total+item.Initial_Target__c,0);
        this.targets = this.targets.toLocaleString('en-us');
        //this.price = this.rows.reduce((total,item)=> total+item.Price__c,0);
        this.intialR05 = this.rows.reduce((total,item)=> total+item.Initial_R05__c,0);
        this.intialR05 = this.intialR05.toLocaleString('en-us');
        this.simulatorTraget = this.rows.reduce((total,item)=> total+item.Actual_Target__c,0);
        this.simulatorTraget = this.simulatorTraget.toLocaleString('en-us');
        //this.simulatorprice = this.rows.reduce((total,item)=> total+item.Actual_Price__c,0);
        this.simulatorR05 = this.rows.reduce((total,item)=> total+item.Actual_R05__c,0);
        this.simulatorR05 = this.simulatorR05.toLocaleString('en-us');
        this.actuvaltons = this.rows.reduce((total,item)=> total+item.Actual_Tons__c,0);
        console.log('step1'+this.actuvaltons);
        this.actuvaltons = Math.round(this.actuvaltons).toLocaleString('en-us');
        //this.actuvalprice = this.rows.reduce((total,item)=> total+item.Sales_Price__c,0);
        console.log('step1'+this.actuvalprice);
        this.actuvalR05 = this.rows.reduce((total,item)=> total+item.Sales_R05__c,0);
        this.actuvalR05 = this.actuvalR05.toLocaleString('en-us');
        this.cost = this.rows.reduce((total,item)=> total+item.Cost__c,0);
        this.R25 = this.rows.reduce((total,item)=> total+item.R25_Value__c,0);
        this.R25 = this.R25.toLocaleString('en-us');
        this.R30 = this.rows.reduce((total,item)=> total+item.R30_Value__c,0);
        this.R30 = this.R30.toLocaleString('en-us');
        console.log('Total'+this.targets);
    }
    fetchInitialTargetRows() {
        const All_Compobox_Valid = [...this.template.querySelectorAll('lightning-combobox')]
            .reduce((validSoFar, input_Field_Reference) => {
                input_Field_Reference.reportValidity();
                return validSoFar && input_Field_Reference.checkValidity();
            }, true);
        if (All_Compobox_Valid) {
            this.template.querySelector('[data-id="layout-container"]').classList.remove('alignCenter');
            getMonthlyInitialTarget({ Region_c: this.selectedRegion, Segment_c: this.selectedSegment, Year_c: this.selectedYear, Month_c: this.selectedMonth })
                .then(response => {
                    if (response.length > 0) {
                        console.log('response....' + response);
                        this.rows = response;
                    }
                    else {
                        this.rows = [{ Product__c: 'CLEAR THIN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'CLEAR THICK', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'DIAMANT THIN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'DIAMANT THICK', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'PARSOL GREEN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'PARSOL BRONZE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'PARSOL DARK GREY', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'MIRROR', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'REF LT GOLD', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'REF DARK GREY', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'REF BRONZE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'REF GREEN', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'REF S BLUE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'PLANILAQUE', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null },
                        { Product__c: 'COATER', Initial_Target__c: 0.00, Price__c: 0.00, Initial_R05__c: 0.00, Cost__c: 0.00, R25_Value__c: 0.00, R30_Value__c: 0.00, Region__c: null, Segment__c: null, Year__c: null, Month__c: null }];
                    }
                    this.fetchRows();
                    this.grandtotal();
                    
                }).catch(error => {
                    this.isLoading = false;
                    this.submitError = error.body.message;
                    this.hasError = true;
                    console.log('error......' + error.body.message);
                })
        }
        else {
            this.template.querySelector('[data-id="layout-container"]').classList.add('alignCenter');
        }
    

    }
    fetchTab2Rows() {
        var self = this;
        let tempArray = [];
        this.rows.forEach(function (value) {
            // do some work on data here
            let R05Value = (value.Actual_Target__c * value.Price__c * 400);
            value.Actual_R05__c = R05Value;
            let SalesR05Value = (value.Actual_Tons__c * value.Sales_Price__c * 400);
            //let ActualRO5 = value.Actual_R05__c
            //value.Actual_R05__c = ActualRO5.replace(/,/g, ''); 
            value.Sales_R05__c = SalesR05Value;
            value.Region__c = self.selectedRegionTab2;
            value.Month__c = self.selectedMonthTab2;
            value.Segment__c = self.selectedSegmentTab2;
            value.Year__c = self.selectedYearTab2;
            tempArray.push(value);
            console.log('tempArray.....' + tempArray.Region__c);
        });
        this.processedActualTargetRows = tempArray.map(row => {
            return {...row,ActuvalTons : row.Actual_Tons__c==null || row.Actual_Tons__c==''?'0':Math.round(row.Actual_Tons__c).toLocaleString('en-us'),InitialRO5 : row.Initial_R05__c.toLocaleString('en-us'),
            ActualR05 : row.Actual_R05__c.toLocaleString('en-us'),InitialTarget:row.Initial_Target__c.toLocaleString('en-us'),Price : Math.round(row.Price__c*10)/10, SalesPrice : Math.round(row.Sales_Price__c*10)/10,
            Sales_R05__c:Math.round(row.Sales_R05__c).toLocaleString('en-us'),ActualPrice : Math.round(row.Actual_Price__c*10)/10}});
        
        if (this.processedActualTargetRows.length > 0)
            this.actualTargetDatatable = true;

        
        
    }
    fetchRows() {
        var self = this;
        let tempArray = [];
        this.rows.forEach(function (value) {
            // do some work on data here
            let R05Value = (value.Initial_Target__c * value.Price__c * 400);
            let R25Value = (value.Initial_Target__c * value.Cost__c * 400);
            let R30Value = (R05Value - R25Value);
            value.Initial_R05__c = R05Value;
            value.R25_Value__c = R25Value;
            value.R30_Value__c = R30Value;
            value.Region__c = self.selectedRegion;
            value.Month__c = self.selectedMonth;
            value.Segment__c = self.selectedSegment;
            value.Year__c = self.selectedYear;
            tempArray.push(value);
            console.log('tempArray.....' + tempArray.Region__c);
        });
        this.processedRows = tempArray;
        if (this.processedRows.length > 0)
            this.datatable = true;


    }
    handleIntialTargetChange(event) {
        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");
        this.rows[rowIndex].Initial_Target__c = target.value;

        this.rows[rowIndex].Initial_R05__c = (this.rows[rowIndex].Initial_Target__c * this.rows[rowIndex].Price__c * 400);
        this.rows[rowIndex].R30_Value__c = (this.rows[rowIndex].Initial_R05__c - this.rows[rowIndex].R25_Value__c);

        this.processedRows = this.rows;
    }
    handleCostChange(event) {

        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");

        this.rows[rowIndex].Cost__c = (target.value === "" || target.value === null) ? 0 : target.value;
        console.log('Cost.....' + this.rows[rowIndex].Cost__c);
        console.log('Cost...||'+JSON.stringify(this.rows));
        this.rows[rowIndex].Cost__c = event.target.value;
        
        //this.cost = this.rows.reduce((total,item)=> (total*0)+item.Cost__c,0);
        this.rows[rowIndex].R25_Value__c = (this.rows[rowIndex].Initial_Target__c * this.rows[rowIndex].Cost__c * 400);
        this.rows[rowIndex].R30_Value__c = (this.rows[rowIndex].Initial_R05__c - this.rows[rowIndex].R25_Value__c);

        this.processedRows = this.rows;
    }
    handlePriceChange(event) {
        var target = event.target;
        var rowIndex = target.getAttribute("data-row-index");

        this.rows[rowIndex].Price__c = (target.value === "" || target.value === null) ? 0 : target.value;
        console.log('Price.....' + this.rows[rowIndex].Price__c);
        this.rows[rowIndex].Price__c = target.value;

        this.rows[rowIndex].Initial_R05__c = (this.rows[rowIndex].Initial_Target__c * this.rows[rowIndex].Price__c * 400);
        this.rows[rowIndex].R30_Value__c = (this.rows[rowIndex].Initial_R05__c - this.rows[rowIndex].R25_Value__c);

        this.processedRows = this.rows;
    }
    async uploadFileHandler(event) {
        this.isLoading = true;
        const uploadedFiles = event.detail.files;
        this.filesUploaded = [{ Title: event.detail.files[0].name }];
        console.log('uploadedFiles[0].documentId.....' + this.filesUploaded);
        console.log('uploadedFiles[0].documentId.....' + uploadedFiles[0].documentId);

        const result = await LightningConfirm.open({
            message: "Are you sure do you want to proceed this document?",
            variant: "inverse",
            label: "Confirm File"
        });
        if (result) {
            // if (uploadedFiles.length > 0) {
            //     console.log(' uploadedFiles[0].....' + uploadedFiles[0]);
            //     const file = uploadedFiles[0];
            //     console.log('file.....' + this.read(file));
            //     // start reading the uploaded csv file

            // }
            targetFileUpload({ contentDocumentId: uploadedFiles[0].documentId })

                .then(response => {
                    if (response === 'Success') {
                        this.isLoading = false;
                        this.hasError = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Monthly Target Document Uploaded Successfully!!',
                                variant: 'success'
                            }),
                        );
                        this.isLoading = false;
                        //this.fetchInitialTargetRows();
                    }

                }).catch(error => {
                    this.isLoading = false;
                    this.error = error.body.message;
                   // this.error = true;
                })
        }
    }
    async read(file) {
        try {
            const result = await this.load(file);
            console.log('result...' + result);
            // execute the logic for parsing the uploaded csv file
            const fileData = this.parse(result);
            console.log('fileData...' + fileData);
        } catch (e) {
            this.error = e;
            console.log('fileData-error...' + e);
        }


    }
    async load(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(reader.error);
            };
            //reader.readAsText(file);
            reader.readAsDataURL(file);
        });
    }
    parse(csv) {
        console.log('csv...' + csv);
        const lines = csv.split(/\r\n|\n/);
        console.log('lines...' + lines);
        const headers = lines[0].split(',');
        this.csvcolumns = headers.map((header) => {
            return { label: header, fieldName: header };
        });

        const data = [];
        lines.forEach((line, i) => {
            if (i === 0) return;

            const obj = {};
            const currentline = line.split(',');

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentline[j];
            }

            data.push(obj);
        });
        this.csvdata = data;
        console.log('data.....' + this.data);
    }
    async submitMonthlyTarget() {
        this.isLoading = true;
        const result = await LightningConfirm.open({
            message: "Are you sure you want to submit this?",
            variant: "inverse",
            label: "Confirm Submit"
        });
        if (result) {

            submitMonthlyTarget({ targetSimulatorRecords: this.processedRows })
                .then(response => {
                    console.log('Result......' + response);
                    this.isLoading = false;
                    this.hasError = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Target Simulator Submitted Successfully!!',
                            variant: 'success'
                        }),
                    );
                    this.fetchInitialTargetRows();
                    this.grandtotal();
                }).catch(error => {
                    this.isLoading = false;
                    this.submitError = error.body.message;
                    this.hasError = true;
                    console.log('error......' + error.body.message);
                })
        }
    }
    async submitAcutalMonthlyTarget() {
        this.isLoading = true;
        const result = await LightningConfirm.open({
            message: "Are you sure you want to submit this?",
            variant: "inverse",
            label: "Confirm Submit"
        });
        if (result) {
            console.log('this.processedActualTargetRows' + this.processedActualTargetRows);
            submitMonthlyTargetByRM({ targetSimulatorRecords: this.processedActualTargetRows })
                .then(response => {
                    console.log('Result......' + response);
                    this.isLoading = false;
                    this.hasError = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Target Simulator Submitted Successfully!!',
                            variant: 'success'
                        }),
                    );
                    this.fetchActualTargetRows();
                }).catch(error => {
                    this.isLoading = false;
                    this.submitError = error.body.message;
                    this.hasError = true;
                    console.log('error......' + error.body.message);
                })
        }
    }
    uploadMTDPrice(event) {
        // Get the list of records from the uploaded files
        const uploadedFiles = event.detail.files;
        InsertMTDPrice({condocid : uploadedFiles[0].documentId})
        .then(result => {
            window.console.log('result ===> '+result); 
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Accounts are created according to the CSV file upload!!!',
                    variant: 'Success',
                }),
            );
        })
        .catch(error => {
            this.error = error.body.message;
            console.log('Error'+JSON.stringify(error))
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error!!',
                    message: JSON.stringify(error),
                    variant: 'error',
                }),
            );     
        })
    }
}
