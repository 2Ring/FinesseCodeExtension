
import * as azdev from 'azure-devops-node-api';
import * as branch from 'git-branch';
import * as vscode from 'vscode';
import { GitPullRequest } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import Utils from '../utils';
import * as _ from 'underscore';
import { WorkItem, WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import * as ncp from 'copy-paste';

export default class VSTS {
    private connection: azdev.WebApi;
    private repository: string;
    private orgUrl: string;
    private project: string;
    private team: string;

    constructor() {
        const token = vscode.workspace.getConfiguration('fle').tfsToken;
        this.orgUrl = vscode.workspace.getConfiguration('fle').tfsUrl;
        this.team = vscode.workspace.getConfiguration('fle').tfsTeam;
        this.repository = vscode.workspace.getConfiguration('fle').tfsRepository;
        this.project = vscode.workspace.getConfiguration('fle').tfsProject;
        const authHandler = azdev.getPersonalAccessTokenHandler(token);
        this.connection = new azdev.WebApi(this.orgUrl, authHandler, { ignoreSslError: true });
    }


    public getAssignedTask() {
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window },
            () => this.getAssignedWorkItems()
        ).then((workItems: WorkItem[]) => {
            if(workItems.length > 0) {
                const workItemsMapped = _.map(workItems, (item) => `${item.fields['System.WorkItemType']} ${item.id}: ${item.fields['System.Title']}`);
                // Task 12911: Test A
                vscode.window.showQuickPick(workItemsMapped).then((selectedWorkItemResult) => {
                    if (selectedWorkItemResult) {
                        ncp.copy(selectedWorkItemResult);
                        const infoMsg = selectedWorkItemResult.substring(0, 40) + '...  Copied!';
                        vscode.window.showInformationMessage(infoMsg);
                    }
                });
            }
        }, (error) => {
            vscode.window.showErrorMessage('Fail to get assigned tasks');
        });
    }

    public createPullRequest() {
        if (vscode.workspace.workspaceFolders) {
            const actualBranchName = branch.sync(vscode.workspace.workspaceFolders[0].uri.fsPath);
            const title = actualBranchName;
            const sourceRefName = 'refs/heads/' + actualBranchName;
            const targetRefName = 'refs/heads/' + actualBranchName.split('/')[0] + '/story';
            const description = `PR: Merge ${sourceRefName} to ${targetRefName} Generated by vscode.`;
            this.getAssignedWorkItems().then((workItems) => {
                const currentWorkItem = workItems.find((wi) => wi.relations.find((rel) => decodeURIComponent(rel.url).endsWith(actualBranchName)) !== undefined);
                if (currentWorkItem) {
                    this.createPullRequestRequest({
                        title,
                        targetRefName,
                        sourceRefName,
                        description
                    }).then((pullRequest) => {
                        this.connection.getWorkItemTrackingApi().then((workItemTrackingApi) => {
                            workItemTrackingApi.updateWorkItem(undefined, [{
                                op: 'add',
                                path: '/relations/-',
                                value: {
                                    rel: 'ArtifactLink',
                                    url: pullRequest.artifactId,
                                    attributes: {
                                        name: 'Pull Request'
                                    }
                                }
                            }], currentWorkItem.id).then((wi) => {
                                vscode.window.showInformationMessage('Pull request successfully created', 'Open').then((button) => {
                                    if (button) {
                                        //https://sbatfs06/2Ring/!ProductBacklog-Blue/Blue/_git/FinesseGadgets/pullrequest/4111#_a=overview
                                        const newPrUrl = `${this.orgUrl}/${this.project}/${this.team}/_git/${this.repository}/pullrequest/${pullRequest.pullRequestId}`;
                                        Utils.OpenUrl(newPrUrl);
                                    }
                                });
                            }).catch((error) => {
                                vscode.window.showErrorMessage('Fail to update work item: ' + error);
                            });
                        });
                    }).catch((error) => {
                        vscode.window.showErrorMessage('Fail to created pull request: ' + error);
                    });
                }
            });
        }
    }

    public openCurrentIterationBoard() {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window },
            () => this.getTeamIterations()
        ).then((teamIterations) => {
            // https://sbatfs06/2Ring/!ProductBacklog-Blue/Blue/_backlogs/TaskBoard/Sprint%2057
            const lastIteration = _.last(teamIterations);
            if (lastIteration) {
                const boardIterationUrl = `${this.orgUrl}/${this.project}/${this.team}/_backlogs/TaskBoard/${lastIteration.name}`;
                Utils.OpenUrl(boardIterationUrl);
            }
        },(error) => {
            vscode.window.showErrorMessage('Fail to open current iteration board: ' + error);
        });
    }

    private async getAssignedWorkItems() {
        return await this.connection.getWorkItemTrackingApi().then((work) => {
            const wiqlQuery = `SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State], [System.AreaPath], [System.IterationPath], [System.Tags] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @me ORDER BY [System.ChangedDate] DESC`;
            return work.queryByWiql({ query: wiqlQuery }, { project: this.project } as TeamContext).then((workItemQueryResult) => {
                if (workItemQueryResult.workItems.length > 0) {
                    return work.getWorkItems(workItemQueryResult.workItems.map((wi) => wi.id), undefined, undefined, WorkItemExpand.Relations);
                } else {
                    vscode.window.showWarningMessage('No assigned tasks!');
                    return [];
                }
            });
        });
    }

    private async getTeamIterations() {
        return await this.connection.getWorkApi().then((workItem) => workItem.getTeamIterations(({ project: this.project }) as TeamContext));
    }

    private async createPullRequestRequest(pullRequestObject: any) {
        return await this.connection.getGitApi().then((git) => git.createPullRequest(pullRequestObject as GitPullRequest, this.repository, this.project));
    }
}
