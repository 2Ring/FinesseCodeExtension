'use strict';
import * as vscode from 'vscode';
import Config from './services/configuration';
import Finesse from './services/finesse';
import { XmlEntities } from 'html-entities';
import { INode } from './services/interfaces';

export function activate(context: vscode.ExtensionContext) {
    const entities = new XmlEntities();
    context.subscriptions.push(vscode.commands.registerCommand('fle.getLayout', () => {
        const configuration = Config.get();
        let configuredNodes = new Map<string, INode>();
        let configuredNodeNames: Array<string> = [];
        if (configuration) {
           configuration.nodes.forEach((node: INode) => {
              configuredNodes.set(node.fqdn, node);
              configuredNodeNames.push(node.fqdn);
           });
        }
        vscode.window.showQuickPick(configuredNodeNames).then((selectedNodeName: any)=>{
            const selectedNodeConfig = configuredNodes.get(selectedNodeName);
            if (selectedNodeConfig) {
                Finesse.getLaytout(selectedNodeConfig).then((layoutXml: string) => {
                    const content = layoutXml.replace(/<TeamLayoutConfig>|<\/TeamLayoutConfig>|<layoutxml>|<\/layoutxml>|<useDefault>[\s\S]*?<\/useDefault>/g, '').trim();
                    vscode.workspace.openTextDocument({ content: entities.decode(content), language: 'xml' }).then(doc => vscode.window.showTextDocument(doc));
                });
            }
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('fle.setLayout', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let doc = editor.document;
        if (doc.languageId === "xml") {
            const configuration = Config.get();
            let configuredNodes = new Map<string, INode>();
            let configuredNodeNames: Array<string> = [];
            if (configuration) {
                configuration.nodes.forEach((node: INode) => {
                    configuredNodes.set(node.fqdn, node);
                    configuredNodeNames.push(node.fqdn);
                });
            }
            vscode.window.showQuickPick(configuredNodeNames).then((selectedNodeName: any) => {
                const selectedNodeConfig = configuredNodes.get(selectedNodeName);
                if (selectedNodeConfig) {
                    const encodedLayout = entities.encode(doc.getText());
                    const content = `<TeamLayoutConfig><layoutxml>${encodedLayout}<\/layoutxml><useDefault>false<\/useDefault><\/TeamLayoutConfig>`;
                    Finesse.setLaytout(content, selectedNodeConfig).then(() => {
                        vscode.window.showInformationMessage('Finesse layout saved');
                    });
                }
            });
        } else {
            return;
        }
    }));

}

export function deactivate() { }