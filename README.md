# vscode-gpt 

GPT code generation utilities for vscode

## Features

Use GPT to generate code.
Select text (Selects current line if no text selected) and hit ctrl+alt+enter (cmd+alt+enter on Mac).

PS: It's best to select the whole method if you want it to rewrite parts of it.

### Extra language features:

#### TypeScript
- Imports from code generation are merged with document imports
- Information about imports in the document are included in the GPT request. (Example: "`import { isHidden } from "someModule";`" in document will generate "`const isHidden: () => boolean`")

#### Python
- Imports from code generation are merged with document imports

## Requirements

An OpenAI account and API key. https://platform.openai.com/account/api-keys

## Extension Settings

* `vscode-gpt.apiKey`: Your OpenAI API key.
* `vscode-gpt.model`: GPT model to use.
* `vscode-gpt.extraPreferences`: Extra preferences. General or for specific language IDs.
    * You can have general or language specific preferences. Here are some examples:
    ```
    {
        "value": "Add comment for complex code."
    },
    {
        "languageId": "typescriptreact",
        "value": "React components are written as following: 'const MyComponent = () => ...' or 'const MyComponent = ({...}:MyComponentProps) => ...'"
    },
    {
        "languageId": "typescript, typescriptreact",
        "value": "Use arrow functions instead of function declarations."
    }
    ```