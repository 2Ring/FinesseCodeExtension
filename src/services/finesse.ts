
import * as _ from 'lodash';
import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import { INode } from './interfaces';

export default class Finesse {
    public static setLaytout(layout: string, node: INode) {
        const basic = new Buffer(`${node.admin}:${node.password}`).toString('base64');
        const options = {
            method: 'PUT',
            uri: `https://${node.fqdn}/finesse/api/Team/${node.team_id}/Layout`,
            headers: {
                'Authorization': 'Basic ' + basic,
                'Content-Type': 'text/xml'
            },
            body: layout
        };
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while saving layout: ' + err);
        });

        return rq;
    }

    public static getLaytout(node: INode) {
        const basic = new Buffer(`${node.admin}:${node.password}`).toString('base64');
        const options = {
            method: 'GET',
            uri: `https://${node.fqdn}/finesse/api/Team/${node.team_id}/Layout`,
            headers: {
                'Authorization': 'Basic ' + basic
            }
        };
        ​
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while getting layout: ' + err);
        });
        
        return rq;
    }
}
