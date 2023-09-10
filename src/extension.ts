// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { generateCode } from "./codeGenerator";

const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(100, 100, 200, 0.8)",
});

export const vsCodeOutput = vscode.window.createOutputChannel("vscode-gpt");

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "vscode-gpt.generateCode",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        let selection: vscode.Range = editor.selection;
        // const languageId = editor.document.languageId;

        if (selection.isEmpty) {
          selection = editor.document.lineAt(selection.start.line).range;
        }

        // const searchQuery = await vscode.window.showInputBox({
        //   placeHolder: "User query",
        //   prompt: "Prompt",
        // });

        // if (!searchQuery) {
        //   return;
        // }

        editor.setDecorations(decorationType, [selection]);

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Processing your command",
            cancellable: true,
          },
          async (progress, token) => {
            progress.report({ message: "Starting..." });

            const result = await generateCode("", selection, editor);

            editor.setDecorations(decorationType, []);

            if (token.isCancellationRequested || !result) {
              return;
            }

            editor.edit((editBuilder) => {
              if (result.importSection) {
                editBuilder.insert(
                  editor.document.lineAt(0).range.start,
                  result.importSection
                );
              }

              editBuilder.replace(selection, result.codeBlock);
            });
          }
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
