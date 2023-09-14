export interface CodeResult {
  codeBlock: string;
  textToReplace?: KeyValuePair[];
}

export type KeyValuePair = {
  key: string;
  value: string;
};
