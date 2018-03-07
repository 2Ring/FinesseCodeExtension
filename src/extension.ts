'use strict';
import * as vscode from 'vscode';
import Config from './services/configuration';
import Finesse from './services/finesse';
import { INode } from './services/interfaces';
import * as xml from 'xml-parse';
export function activate(context: vscode.ExtensionContext) {
    const Configuraton = new Config();
    context.subscriptions.push(vscode.commands.registerCommand('fle.getLayout', () => {
        const ds = Configuraton.get();
        let availableNodes = new Map<string, INode>();
        let availableNodeNames: Array<string> = [];
        if (ds) {
           ds.nodes.forEach((node) => {
              availableNodes.set(node.fqdn, node);
              availableNodeNames.push(node.fqdn);
           });
        }
        vscode.window.showQuickPick(availableNodeNames).then((ss: any)=>{
            const sf = availableNodes.get(ss);
            if (sf) {
                Finesse.getLaytout(sf).then((xml) => {
                    const parsedXML = xml.parse(xml);
                    vscode.workspace.openTextDocument({});
                });
            }
        });
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('fle.setLayout', () => {
        
    }));

}

export function deactivate() {
}