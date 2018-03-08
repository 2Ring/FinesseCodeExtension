'use strict';
import * as vscode from 'vscode';
import Handlers from './handlers';

export function activate(context: vscode.ExtensionContext) {

    const handlers = new Handlers();
    
    context.subscriptions.push(vscode.commands.registerCommand('fle.getLayout', handlers.invokeGetLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.loadConfiguredLayout', handlers.invokeLoadConfiguredLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.setLayout', handlers.invokeSetLayout));
}

export function deactivate() { }