
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';

export default class Configuration {

    public static get = () => {
        if (!vscode.workspace.rootPath) {
            throw { message: 'Open a Folder with VSCode' };
        }
        try {
            return fs.readJsonSync(vscode.workspace.rootPath + path.sep + 'finesse.json');
        }
        catch (err) {
            vscode.window.showErrorMessage('Error while getting configuration: ' + err);
        }
    }
}

