
import * as vscode from 'vscode';
import * as request from 'request-promise-native';
import { INode, IGadgetFinesseApiConfig } from '../interfaces';


export default class Services {
    public static setLayout(layout: string, node: INode) {
        const basic = new Buffer(`${node.admin}:${node.password}`).toString('base64');
        const options = {
            method: 'PUT',
            uri: Services.getFinesseLayoutUri(node),
            headers: {
                'Authorization': 'Basic ' + basic,
                'Content-Type': 'Application/XML'
            },
            agentOptions: {
                rejectUnauthorized: false
            },
            body: layout
        };
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while saving layout: ' + err);
        });
        rq.then(() => {
            vscode.window.showInformationMessage('Finesse layout saved!');
        });

        return rq;
    }

    public static getLayout(node: INode) {
        const basic = new Buffer(`${node.admin}:${node.password}`).toString('base64');
        const options = {
            method: 'GET',
            uri: Services.getFinesseLayoutUri(node),
            headers: {
                'Authorization': 'Basic ' + basic,
                'Content-Type': 'Application/XML'
            },
            agentOptions: {
                rejectUnauthorized: false
            }
        };
        ​
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while getting layout: ' + err);
        });

        return rq;
    }

    public static getGadgetFinesseApiConfig() {
        const gadgetServerUri = vscode.workspace.getConfiguration('fle').get<boolean>('gadgetServerUri');
        const options = {
            method: 'GET',
            uri: `${gadgetServerUri}/Services/config/FinesseApiService`,
            headers: {
                'Content-Type': 'application/json'
            },
            agentOptions: {
                rejectUnauthorized: false
            }
        };
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while getting Gadget Finesse config: ' + err);
        });

        return rq;
    }

    public static setGadgetFinesseApiConfig(data: IGadgetFinesseApiConfig) {
        const gadgetServerUri = vscode.workspace.getConfiguration('fle').get<boolean>('gadgetServerUri');
        const options = {
            method: 'POST',
            uri: `${gadgetServerUri}/Services/config/FinesseApiService`,
            headers: {
                'Content-Type': 'application/json'
            },
            agentOptions: {
                rejectUnauthorized: false
            },
            body: JSON.stringify(data)
        };
        const rq = request(options).promise();
        rq.catch((err) => {
            vscode.window.showErrorMessage('Error while saving Gadget Finesse config: ' + err);
        });

        return rq;
    }

    private static getFinesseLayoutUri (node: INode) {
        const schema = node.schema ? node.schema : 'http';
        const port = node.port ? ':' + node.port : '';

        return `${schema}://${node.fqdn}${port}/finesse/api/Team/${node.team_id}/LayoutConfig`;
    }
}
