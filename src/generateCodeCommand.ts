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
          const currentText = editor.document.getText();

          if (result.importSection) {
            result.importSection.split("\n").forEach((line) => {
              line = line.trim();

              if (!currentText.includes(line)) {
                editBuilder.insert(
                  editor.document.lineAt(0).range.start,
                  line + "\n"
                );
              }
            });
          }

          editBuilder.replace(selection, result.codeBlock);
        });
      }
    );
  }
};
