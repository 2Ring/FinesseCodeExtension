
import * as vscode from 'vscode';
import { XmlEntities } from 'html-entities';
import Configuration from './configuration';
import Finesse from './finesse';

export default class Handlers {
    private entities: any;
    private configuration: Configuration;
    private statusBarItem: any;
    
    constructor() {
        this.entities = new XmlEntities();
        this.configuration = new Configuration();
        this.statusBarItem = null;
        this.createShortcut();
    }

    public invokeSetLayout = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const doc = editor.document;
        if (doc.languageId === "xml") {
            vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any) => {
                if (!selectedNodeName) {
                    return;
                }
                const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
                if (selectedNodeConfig) {
                    const encodedLayout = this.entities.encode(doc.getText());
                    const content = `<TeamLayoutConfig><layoutxml>${encodedLayout}<\/layoutxml><useDefault>false<\/useDefault><\/TeamLayoutConfig>`;
                    Finesse.setLaytout(content, selectedNodeConfig);
                }
            });
        } else {
            return;
        }
    }

    public invokeLoadConfiguredLayout = () => {
        vscode.window.showQuickPick(this.configuration.pickConfiguredLayoutsName()).then((selectedLayoutName: any)=>{
            if (!selectedLayoutName) {
                return;
            }
            const layoutContent = this.configuration.getConfiguredLayoutContentByName(selectedLayoutName);
            vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any)=>{
                if (!selectedNodeName) {
                    return;
                }
                const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
                if (selectedNodeConfig) {
                    const encodedLayout = this.entities.encode(layoutContent);
                    const content = `<TeamLayoutConfig><layoutxml>${encodedLayout}<\/layoutxml><useDefault>false<\/useDefault><\/TeamLayoutConfig>`;
                    Finesse.setLaytout(content, selectedNodeConfig);
                }
            });
        });
    }

    public invokeGetLayout = () => {
        vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any)=>{
            if (!selectedNodeName) {
                return;
            }
            const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
            if (selectedNodeConfig) {
                Finesse.getLaytout(selectedNodeConfig).then((layoutXml: string) => {
                    const content = layoutXml.replace(/<TeamLayoutConfig>|<\/TeamLayoutConfig>|<layoutxml>|<\/layoutxml>|<useDefault>[\s\S]*?<\/useDefault>/g, '').trim();
                    vscode.workspace.openTextDocument({ content: this.entities.decode(content), language: 'xml' }).then(doc => vscode.window.showTextDocument(doc));
                });
            }
        });
    }

    public dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
        }
    }

    private createShortcut = () => {
        if (!this.statusBarItem && vscode.workspace.getConfiguration('fle').get<boolean>('showLayoutListShortcut')) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.statusBarItem.text = '$(diff-renamed)';
            this.statusBarItem.tooltip = 'Change finesse layout';
            this.statusBarItem.command = 'fle.loadConfiguredLayout';
            this.statusBarItem.show();
        }
    }
}

