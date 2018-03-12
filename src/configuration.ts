
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { INode } from './interfaces';

export default class Configuration {
    private configuredNodes: Map<string, INode>;
    private configuredLayouts: Map<string, any>;
    private configPath: string;

    constructor () {
        this.configuredNodes = new Map<string, INode>();
        this.configuredLayouts = new Map<string, any>();
        const layoutConfigurationPath = vscode.workspace.getConfiguration("fle").layoutConfigurationPath;
        this.configPath = layoutConfigurationPath ? layoutConfigurationPath : vscode.workspace.rootPath;
    }

    public get = () => {
        try {
            if (fs.existsSync(this.configPath + path.sep + 'finesse.json')) {
                return fs.readJsonSync(this.configPath + path.sep + 'finesse.json');
            } else {
                vscode.window.showWarningMessage('Finesse missing configuration');
                return;
            }
        }
        catch (err) {
            vscode.window.showErrorMessage('Error while getting configuration: ' + err);
        }
    }

    public pickNodesName = (): Array<string> => {
        const configuration = this.get();
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

    public getNodeByName = (name: string): INode | undefined => this.configuredNodes.get(name);

    public pickConfiguredLayoutsName = (): Array<string> => {
        const readedFiles = fs.readdirSync(this.configPath);
        const relevantFiles = readedFiles.filter((file) => file.endsWith('.xml'));
        this.configuredNodes.clear();
        const configuredLayoutsNames: Array<string> = [];
        for (const readedFile of relevantFiles) {
          const filePath = path.join(this.configPath, readedFile);
          this.configuredLayouts.set(readedFile, filePath);
          configuredLayoutsNames.push(readedFile);
        }

        return configuredLayoutsNames;
    }

    public getConfiguredLayoutContentByName = (name: string): string => {
        const selectedLayoutPath = this.configuredLayouts.get(name);
        return fs.readFileSync(selectedLayoutPath).toString();
    }
}

