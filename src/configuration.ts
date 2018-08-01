
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import Services from './services';
import { INode, IGadgetFinesseApiConfig } from './interfaces';

export default class Configuration {

    public currentFinesseApiConfig: IGadgetFinesseApiConfig | null;

    private configuredNodes: Map<string, INode>;
    private configuredLayouts: Map<string, any>;
    private layoutsPath: string;
    private gadgetsJsonPath: string;
    private onFinesseApiConfigChangeCallbacks: Array<(data: IGadgetFinesseApiConfig)=>void>;

    constructor () {
        this.configuredNodes = new Map<string, INode>();
        this.currentFinesseApiConfig = null;
        this.configuredLayouts = new Map<string, any>();
        const gadgetsSourcesPath = vscode.workspace.getConfiguration("fle").gadgetsSourcesPath;
        this.onFinesseApiConfigChangeCallbacks = [];
        this.gadgetsJsonPath = gadgetsSourcesPath + path.sep + 'Services' + path.sep + 'App_Data' + path.sep + 'gadgets.json';
        this.layoutsPath = (gadgetsSourcesPath ? gadgetsSourcesPath : vscode.workspace.rootPath) + path.sep + 'Layouts';

        fs.watchFile(this.gadgetsJsonPath, () => {
            this.getGadgetFinesseApiConfig().then((data: string) => {
                this.onFinesseApiConfigChangeCallbacks.forEach((callback) => {
                    callback(JSON.parse(data));
                });
            });
        });
    }

    public onFinesseApiConfigChanged = (callback: (data: IGadgetFinesseApiConfig) => void) => {
        this.onFinesseApiConfigChangeCallbacks.push(callback);
    }

    public getFinesseJson = () => {
        try {
            if (fs.pathExistsSync(this.layoutsPath) && fs.existsSync(this.layoutsPath + path.sep + 'finesse.json')) {
                return fs.readJsonSync(this.layoutsPath + path.sep + 'finesse.json');
            } else {
                vscode.window.showWarningMessage('Finesse missing finesse.json or configuration folder');
                return;
            }
        }
        catch (err) {
            vscode.window.showErrorMessage('Error while getting configuration: ' + err);
        }
    }


    public getGadgetFinesseApiConfig = () => {
        const req = Services.getGadgetFinesseApiConfig();
        req.then((data: string) => {
            this.currentFinesseApiConfig = JSON.parse(data);
        });

        return req;
    }

    public setGadgetFinesseApiConfig = (data: IGadgetFinesseApiConfig) => Services.setGadgetFinesseApiConfig(data);

    public pickNodesName = (): Array<string> => {
        const configuration = this.getFinesseJson();
        this.configuredNodes.clear();
        const configuredNodeNames: Array<string> = [];
        if (configuration) {
            configuration.nodes.forEach((node: INode) => {
                this.configuredNodes.set(node.fqdn, node);
                configuredNodeNames.push(node.fqdn);
            });
        }

        return configuredNodeNames;
    }

    public getNodeByName = (name: string): INode | undefined => {
        if(this.configuredNodes.size === 0) {
           this.pickNodesName(); 
        }

        return this.configuredNodes.get(name);
    }

    public pickConfiguredLayoutsName = (): Array<string> => {
        this.getFinesseJson();
        const readedFiles = fs.readdirSync(this.layoutsPath);
        const relevantFiles = readedFiles.filter((file) => file.endsWith('.xml'));
        this.configuredNodes.clear();
        const configuredLayoutsNames: Array<string> = [];
        for (const readedFile of relevantFiles) {
          const filePath = path.join(this.layoutsPath, readedFile);
          this.configuredLayouts.set(readedFile, filePath);
          configuredLayoutsNames.push(readedFile);
        }

        return configuredLayoutsNames;
    }

    public getConfiguredLayoutContentByName = (name: string): string => {
        const selectedLayoutPath = this.configuredLayouts.get(name);
        return fs.readFileSync(selectedLayoutPath).toString();
    }

    public dispose = () => {
        fs.unwatchFile(this.gadgetsJsonPath);
    }
}

