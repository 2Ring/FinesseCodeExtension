export interface IConfig {
    nodes: Array<INode>;
    gadgetServerUri: string;
 }

 export interface INode {
    fqdn: string;
    schema: string;
    port: string;
    deploymentType: string;
    admin: string;
    password: string;
    team_id: string;
 }

 export interface IGadgetFinesseApiConfig {
     adminName: string;
     adminPassword: string;
     finessePrimaryNode: string;
     finesseDeploymentType: string;
 }