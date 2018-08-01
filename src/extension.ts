'use strict';
import * as vscode from 'vscode';
import Handlers from './handlers';



const handlers = new Handlers();

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('fle.getLayout', handlers.invokeGetLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.loadConfiguredLayout', handlers.invokeLoadConfiguredLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.setLayout', handlers.invokeSetLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.switchFinesse', handlers.invokeSwitchLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.generateLayout', handlers.invokeGenerateLayout));
    context.subscriptions.push(vscode.commands.registerCommand('fle.recycleAppPool', handlers.invokeRecycleAppPool));

    context.subscriptions.push(handlers);

}

export function deactivate() {
    handlers.dispose();
 }