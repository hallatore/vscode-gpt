export interface CodeResult {
  codeBlock: string;
  textToReplace?: KeyValuePair[];
  modifiedQuery?: string;
}

export type KeyValuePair = {
  key: string;
  value: string;
};
