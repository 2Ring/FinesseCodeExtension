export interface IConfig {
    nodes: Array<INode>;
 }

 export interface INode {
    fqdn: string;
    admin: string;
    password: string;
    team_id: string;
 }