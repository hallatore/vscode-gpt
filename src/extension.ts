import * as vscode from "vscode";
import { codeGenerationCommand } from "./generateCodeCommand";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "vscode-gpt.generateCode",
    codeGenerationCommand
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
