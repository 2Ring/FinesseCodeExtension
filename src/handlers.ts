
import * as vscode from 'vscode';
import { XmlEntities } from 'html-entities';
import Configuration from './configuration';
import Services from './services';
import Generator from './layoutGenerator';
import { exec } from 'child_process';
import { GadgetType } from './enums';
import { IGadgetFinesseApiConfig } from './interfaces';

export default class Handlers {
    private entities: any;
    private configuration: Configuration;
    private generator: Generator;
    private loadConfiguredLayoutStatusBarItem: any;
    private switchLayoutStatusBarItem: any;

    constructor() {
        this.entities = new XmlEntities();
        this.configuration = new Configuration();
        this.generator = new Generator();
        this.loadConfiguredLayoutStatusBarItem = null;
        this.switchLayoutStatusBarItem = null;
        this.createloadConfiguredLayoutStatusBarItem();
        this.createSwitchLayoutStatusBarItem();

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
                    Services.setLayout(content, selectedNodeConfig);
                }
            });
        } else {
            return;
        }
    }

    public invokeGenerateLayout = (gadgetTypes?: Set<string>) => {
        const availableGadgets: Array<string> = [];
        if (!gadgetTypes) {
            gadgetTypes = new Set([GadgetType.Toolbar, GadgetType.Ticker, GadgetType.Team, GadgetType.Dialog, GadgetType.Browser, 'DONE']);
        }

        gadgetTypes.forEach((ga) => availableGadgets.push(ga));

        vscode.window.showQuickPick(availableGadgets).then((type?: string) => {
            switch (type) {
                case GadgetType.Browser:
                case GadgetType.Dialog:
                case GadgetType.Team:
                case GadgetType.Ticker:
                case GadgetType.Toolbar:
                    this.generator.addGadget(type);
                    if (gadgetTypes) {
                        gadgetTypes.delete(type);
                        this.invokeGenerateLayout(gadgetTypes);
                    }
                    break;
                default:
                        vscode.workspace.openTextDocument({ content: this.generator.getGeneratedLayout(), language: 'xml' }).then(doc => vscode.window.showTextDocument(doc));
                        this.generator.resetLayout();
                    break;
            }
        });
    }

    public invokeSwitchLayout = () => {
        vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any) => {
            if (!selectedNodeName) {
                return;
            }
            const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
            if (selectedNodeConfig) {
                Services.getGadgetFinesseApiConfig().then((finesseApiConfig: string) => {
                    const config: IGadgetFinesseApiConfig = JSON.parse(finesseApiConfig);
                    config.adminName = selectedNodeConfig.admin;
                    config.adminPassword = selectedNodeConfig.password;
                    config.finesseDeploymentType = selectedNodeConfig.deploymentType || 'UCCE';
                    config.finessePrimaryNode = selectedNodeConfig.fqdn;

                    Services.setGadgetFinesseApiConfig(config).then(() => {
                        vscode.window.showInformationMessage('Gadget Finesse api config changed!');
                        this.switchLayoutStatusBarItem.text = config.finessePrimaryNode;
                        exec(`%SystemRoot%\\system32\\inetsrv\\appcmd.exe recycle apppool /apppool.name:DefaultAppPool`, (err) => {
                            if (err) { throw err; }
                            vscode.window.showInformationMessage('DefaultAppPool Recycled..');
                        });
                    });
                });
            }
        });
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
                    Services.setLayout(content, selectedNodeConfig);
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
                Services.getLayout(selectedNodeConfig).then((layoutXml: string) => {
                    const content = layoutXml.replace(/<TeamLayoutConfig>|<\/TeamLayoutConfig>|<layoutxml>|<\/layoutxml>|<useDefault>[\s\S]*?<\/useDefault>/g, '').trim();
                    vscode.workspace.openTextDocument({ content: this.entities.decode(content), language: 'xml' }).then(doc => vscode.window.showTextDocument(doc));
                });
            }
        });
    }

    public dispose() {
        if (this.loadConfiguredLayoutStatusBarItem) {
            this.loadConfiguredLayoutStatusBarItem.dispose();
        }
        if (this.switchLayoutStatusBarItem) {
            this.switchLayoutStatusBarItem.dispose();
        }
    }

    private createSwitchLayoutStatusBarItem = () => {
        if (!this.switchLayoutStatusBarItem) {
            this.switchLayoutStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
            this.switchLayoutStatusBarItem.tooltip = 'Switch Gadget finesse api config';
            this.switchLayoutStatusBarItem.command = 'fle.switchFinesse';
            this.switchLayoutStatusBarItem.text = 'undefined';
            this.switchLayoutStatusBarItem.show();
        }
        Services.getGadgetFinesseApiConfig().then((finesseApiConfig: string) => {
            this.switchLayoutStatusBarItem.text = JSON.parse(finesseApiConfig).finessePrimaryNode;
        });
    }

    private createloadConfiguredLayoutStatusBarItem = () => {
        if (!this.loadConfiguredLayoutStatusBarItem) {
            this.loadConfiguredLayoutStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
            this.loadConfiguredLayoutStatusBarItem.text = '$(diff-renamed)';
            this.loadConfiguredLayoutStatusBarItem.tooltip = 'Change finesse layout';
            this.loadConfiguredLayoutStatusBarItem.command = 'fle.loadConfiguredLayout';
            this.loadConfiguredLayoutStatusBarItem.show();
        }
    }
}

