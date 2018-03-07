
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from "lodash";
import * as vscode from 'vscode';
import { IConfig } from './interfaces';

export default class Configuration {
    private config!: IConfig;

    public get = () =>  {
        if (!this.config) {
            if (!vscode.workspace.rootPath) {
                throw { message: 'Open a Folder with VSCode' };
            }
            try {
                this.config = _.extend(this.config || {}, fs.readJsonSync(vscode.workspace.rootPath + path.sep + 'finess.json'));
                return this.config;
            }
            catch (err) {
                vscode.window.showErrorMessage('Error while getting configuration: ' + err);
            }
        } else {
            return this.config;
        }
    }
}

