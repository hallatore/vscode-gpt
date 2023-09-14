import * as vscode from "vscode";
import { generateCode } from "./code-generation/codeGenerator";

const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(100, 100, 200, 0.8)",
});

export const codeGenerationCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    let selection: vscode.Range = editor.selection;

    if (selection.isEmpty) {
      selection = editor.document.lineAt(selection.start.line).range;
    } else if (selection.start.line !== selection.end.line) {
      // If the selection spans multiple lines, we want to select the entire first line to preserve indentation
      selection = new vscode.Range(
        new vscode.Position(selection.start.line, 0),
        new vscode.Position(selection.end.line, selection.end.character)
      );
    }

    const extraInstructions = await vscode.window.showInputBox({
      title: "Extra instructions",
      placeHolder: "For example: Extract interfaces (or leave blank)",
    });

    if (extraInstructions === undefined) {
      return;
    }

    editor.setDecorations(decorationType, [selection]);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Processing your command",
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({ message: "Starting..." });
        const result = await generateCode(extraInstructions, selection, editor);
        editor.setDecorations(decorationType, []);

        if (token.isCancellationRequested || !result) {
          return;
        }

        editor.edit((editBuilder) => {
          editBuilder.replace(selection, result.codeBlock);

          if (result.textToReplace) {
            result.textToReplace.forEach((item) => {
              if (item.key === "") {
                editBuilder.insert(editor.selection.start, item.value + "\n");
                return;
              }

              const currentText = editor.document.getText();
              const itemIndex = currentText.indexOf(item.key);
              if (itemIndex !== -1) {
                const position = editor.document.positionAt(itemIndex);
                editBuilder.replace(
                  new vscode.Selection(
                    position,
                    position.translate(0, item.key.length)
                  ),
                  item.value
                );
              }
            });
          }
        });
      }
    );
  }
};
