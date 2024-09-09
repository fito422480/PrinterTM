declare module "xml2js" {
  export interface ParserOptions {
    explicitArray?: boolean;
    [key: string]: any;
  }

  export class Parser {
    constructor(options?: ParserOptions);
    parseStringPromise(xml: string): Promise<any>;
    parseString(xml: string, callback: (err: Error, result: any) => void): void;
  }

  export class Builder {
    constructor(options?: ParserOptions);
    buildObject(obj: any): string;
  }
}
