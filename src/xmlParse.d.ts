declare module 'xml-parse' {
    export function parse(xml: string): any;
    export function stringify(xmlDoc: any, spacing: number): string;
}