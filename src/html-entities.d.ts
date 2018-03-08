declare module 'html-entities' {
    export class XmlEntities {
        decode(xml: string): string;
        encode(xml: string): string;
    }
}