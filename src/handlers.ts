
import * as vscode from 'vscode';
import { XmlEntities } from 'html-entities';
import Configuration from './configuration';
import Services from './services';
import { exec } from 'child_process';
import { IGadgetFinesseApiConfig } from './interfaces';

export default class Handlers {
    private entities: any;
    private configuration: Configuration;
    private loadConfiguredLayoutStatusBarItem: any;
    private switchLayoutStatusBarItem: any;
    private recycleAppPoolStatusBarItem: any;

    constructor() {
        this.entities = new XmlEntities();
        this.configuration = new Configuration();
        this.loadConfiguredLayoutStatusBarItem = null;
        this.switchLayoutStatusBarItem = null;
        this.recycleAppPoolStatusBarItem = null;
        this.createLoadConfiguredLayoutStatusBarItem();
        this.createSwitchLayoutStatusBarItem();
        this.createRecycleAppPoolStatusBarItem();

        this.configuration.onFinesseApiConfigChanged((data: IGadgetFinesseApiConfig) => {
            this.switchLayoutStatusBarItem.text = data.finessePrimaryNode;
        });
    }

    public invokeSetLayout = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const doc = editor.document;
        if (doc.languageId === "xml") {
            const encodedLayout = this.entities.encode(doc.getText());
            const content = `<TeamLayoutConfig><layoutxml>${encodedLayout}<\/layoutxml><useDefault>false<\/useDefault><\/TeamLayoutConfig>`;

            this.setFinesseLayout(content);
        } else {
            return;
        }
    }

    public invokeRecycleAppPool = () => {
        const appPoolName = vscode.workspace.getConfiguration("fle").appPool;
        exec(`%SystemRoot%\\system32\\inetsrv\\appcmd.exe recycle apppool /apppool.name:${appPoolName}`, (err) => {
            if (err) { throw err; }
            vscode.window.showInformationMessage(`${appPoolName} Recycled..`);
        });
    }

    public invokeSwitchLayout = () => {
        vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any) => {
            if (!selectedNodeName) {
                return;
            }
            const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
            if (selectedNodeConfig) {
                this.configuration.getGadgetFinesseApiConfig().then((finesseApiConfig: string) => {
                    const config: IGadgetFinesseApiConfig = JSON.parse(finesseApiConfig);
                    config.adminName = selectedNodeConfig.admin;
                    config.adminPassword = selectedNodeConfig.password;
                    config.finesseDeploymentType = selectedNodeConfig.deploymentType || 'UCCE';
                    config.finessePrimaryNode = selectedNodeConfig.fqdn;

                    this.configuration.setGadgetFinesseApiConfig(config).then(() => {
                        vscode.window.showInformationMessage('Gadget Finesse api config changed!');
                        this.invokeRecycleAppPool();
                    });
                });
            }
        });
    }

    public invokeLoadConfiguredLayout = () => {
        vscode.window.showQuickPick(this.configuration.pickConfiguredLayoutsName()).then((selectedLayoutName: any) => {
            if (!selectedLayoutName) {
                return;
            }
            const layoutContent = this.configuration.getConfiguredLayoutContentByName(selectedLayoutName);
            const encodedLayout = this.entities.encode(layoutContent);
            const content = `<TeamLayoutConfig><layoutxml>${encodedLayout}<\/layoutxml><useDefault>false<\/useDefault><\/TeamLayoutConfig>`;
            this.setFinesseLayout(content);
        });
    }

    public invokeGetLayout = () => {
        const useQuickPick = vscode.workspace.getConfiguration("fle").quickPickFinesseNode;
        if (!useQuickPick) {
            vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any) => {
                if (!selectedNodeName) {
                    return;
                }
                const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
                if (selectedNodeConfig) {
                    Services.getLayout(selectedNodeConfig).then((layoutXml: string) => this.openFinesseLayoutXml(layoutXml));
                }
            });
        } else {
            if (this.configuration.currentFinesseApiConfig) {
                const selectedNodeConfig = this.configuration.getNodeByName(this.configuration.currentFinesseApiConfig.finessePrimaryNode);
                if (selectedNodeConfig) {
                    Services.getLayout(selectedNodeConfig).then((layoutXml: string) => this.openFinesseLayoutXml(layoutXml));
                }
            }
        }
    }

    public dispose() {
        if (this.loadConfiguredLayoutStatusBarItem) {
            this.loadConfiguredLayoutStatusBarItem.dispose();
        }
        if (this.switchLayoutStatusBarItem) {
            this.switchLayoutStatusBarItem.dispose();
        }
        if (this.recycleAppPoolStatusBarItem) {
            this.recycleAppPoolStatusBarItem.dispose();
        }
        this.configuration.dispose();
    }

    private openFinesseLayoutXml = (layoutXml: string) => {
        const content = layoutXml.replace(/<TeamLayoutConfig>|<\/TeamLayoutConfig>|<layoutxml>|<\/layoutxml>|<useDefault>[\s\S]*?<\/useDefault>/g, '').trim();
        vscode.workspace.openTextDocument({ content: this.entities.decode(content), language: 'xml' }).then(doc => vscode.window.showTextDocument(doc));
    }

    private setFinesseLayout = (layoutXml: string) => {
        const useQuickPick = vscode.workspace.getConfiguration("fle").quickPickFinesseNode;
        if (!useQuickPick) {
            vscode.window.showQuickPick(this.configuration.pickNodesName()).then((selectedNodeName: any) => {
                if (!selectedNodeName) {
                    return;
                }
                const selectedNodeConfig = this.configuration.getNodeByName(selectedNodeName);
                if (selectedNodeConfig) {
                    Services.setLayout(layoutXml, selectedNodeConfig);
                }
            });
        } else {
            if (this.configuration.currentFinesseApiConfig) {
                const selectedNodeConfig = this.configuration.getNodeByName(this.configuration.currentFinesseApiConfig.finessePrimaryNode);
                if (selectedNodeConfig) {
                    Services.setLayout(layoutXml, selectedNodeConfig);
                }
            }
        }
    }

    private createSwitchLayoutStatusBarItem = () => {
        if (!this.switchLayoutStatusBarItem) {
            this.switchLayoutStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);
            this.switchLayoutStatusBarItem.tooltip = 'Switch Gadget finesse api config';
            this.switchLayoutStatusBarItem.command = 'fle.switchFinesse';
            this.switchLayoutStatusBarItem.text = '';
            this.switchLayoutStatusBarItem.show();
        }
        this.configuration.getGadgetFinesseApiConfig().then((finesseApiConfig: string) => {
            this.switchLayoutStatusBarItem.text = JSON.parse(finesseApiConfig).finessePrimaryNode;
        });
    }

    private createRecycleAppPoolStatusBarItem = () => {
        if (!this.recycleAppPoolStatusBarItem) {
            this.recycleAppPoolStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
            this.recycleAppPoolStatusBarItem.tooltip = 'Recycle AppPool';
            this.recycleAppPoolStatusBarItem.command = 'fle.recycleAppPool';
            this.recycleAppPoolStatusBarItem.text = '$(trashcan)';
            this.recycleAppPoolStatusBarItem.show();
        }
    }

    private createLoadConfiguredLayoutStatusBarItem = () => {
        if (!this.loadConfiguredLayoutStatusBarItem) {
            this.loadConfiguredLayoutStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
            this.loadConfiguredLayoutStatusBarItem.text = '$(diff-renamed)';
            this.loadConfiguredLayoutStatusBarItem.tooltip = 'Change finesse layout';
            this.loadConfiguredLayoutStatusBarItem.command = 'fle.loadConfiguredLayout';
            this.loadConfiguredLayoutStatusBarItem.show();
        }
    }
}

