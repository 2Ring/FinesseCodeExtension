'use strict';
import * as vscode from 'vscode';
import Handlers from './handlers';
import glob = require('glob');

const handlers = new Handlers();

export function activate(context: vscode.ExtensionContext) {
    const s = {
        'Clients': {
            childrens: {
                'Dialog': {
                    scripts: {
                        'fiis': ''
                    }
                }
            },
            scripts: {
                'build': ''
            },
            fsPath: ''
        }
    };
    let sss: any = {};
    const sa = vscode.workspace.workspaceFolders || [];
    if (sa) {
        sa.forEach(element => {
            glob('**/package.json', {
                cwd: element.uri.fsPath,
                ignore: 'node_modules/**'
            }, (a, items) => {
                items.forEach((val) => {
                    if (!sss[element.name]) {
                        sss[element.name] = {};
                    }
                    sss[element.name] = Object.assign({}, val.split('/'));
                });
                debugger;
            });
        });
    }



    context.subscriptions.push(vscode.commands.registerCommand('fle.getLayout', handlers.invokeGetLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.loadConfiguredLayout', handlers.invokeLoadConfiguredLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.setLayout', handlers.invokeSetLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.switchFinesse', handlers.invokeSwitchLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.recycleAppPool', handlers.invokeRecycleAppPool));
    context.subscriptions.push(vscode.commands.registerCommand('fle.tfsCreatePullRequest', handlers.invokeTfsCreatePullRequest));
    context.subscriptions.push(vscode.commands.registerCommand('fle.tfsOpenCurrentIterationBoard', handlers.invokeTfsOpenCurrentIterationBoard));
    context.subscriptions.push(vscode.commands.registerCommand('fle.tfsGetAssignedTask', handlers.invokeTfsGetAssignedTask));

    context.subscriptions.push(handlers);
}

export function deactivate() {
    handlers.dispose();
 }