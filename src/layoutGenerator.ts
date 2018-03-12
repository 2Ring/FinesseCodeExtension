import * as xmlbuilder from 'xmlbuilder';
import * as vscode from 'vscode';
import { GadgetType } from './enums';

export default class LayoutGenerator {
    private generatedXml: xmlbuilder.XMLElementOrXMLNode;
    constructor() {
        this.generatedXml = this.baseOfLayout();
    }

    public resetLayout() {
        this.generatedXml = this.baseOfLayout();
    }

    public getGeneratedLayout() {
        return this.generatedXml.end({ pretty: true });
    }

    public addGadget(gadgetType: GadgetType) {
        const gadgetServerUri = vscode.workspace.getConfiguration('fle').get<boolean>('gadgetServerUri');
        this.generatedXml.ele('gadget', `${gadgetServerUri}/Clients/${gadgetType.toString()}/gadget.xml`).up();
    }

    private baseOfLayout(): xmlbuilder.XMLElementOrXMLNode {
        return xmlbuilder.create('finesseLayout')
            .att('xmlns', 'http://www.cisco.com/vtg/finesse')
            .ele('layout')
            .ele('role', 'Supervisor').up()
            .ele('page');
    }
}