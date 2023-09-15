import * as vscode from "vscode";
import { generateCode } from "./code-generation/codeGenerator";
import { CodeResult } from "./code-generation/CodeResult";

export const codeGenerationCommand = async () => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    let selection: vscode.Range = editor.selection;
    const lineEndingCharacter =
      editor.document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";

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

    // If the user cancels the input box, we don't want to do anything
    if (extraInstructions === undefined) {
      return;
    }

    // Clear current selection in the editor window
    var position = editor.selection.start;
    editor.selection = new vscode.Selection(position, position);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({ message: extraInstructions });
        let currentSelection = selection;
        let isFirstEdit = true;
        let isUpdating = false;

        const handleTextToReplace = (
          result: CodeResult | null
        ): Thenable<boolean> => {
          if (!result?.textToReplace) {
            return Promise.resolve(false);
          }

          return editor.edit(
            (editBuilder) => {
              result.textToReplace!.forEach((item) => {
                if (item.key === "") {
                  editBuilder.insert(
                    editor.document.positionAt(0),
                    item.value + lineEndingCharacter
                  );
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
            },
            { undoStopBefore: false, undoStopAfter: false }
          );
        };

        const handleResult = (result: CodeResult | null): Thenable<boolean> => {
          if (token.isCancellationRequested || !result || isUpdating) {
            return Promise.resolve(false);
          }
          isUpdating = true;

          const currentText = editor.document.getText(currentSelection);
          let codeBlock = ensureCorrectLineEndings(
            result.codeBlock,
            editor.document
          );

          if (result.modifiedQuery) {
            progress.report({ message: result.modifiedQuery });
          }

          return editor
            .edit(
              (editBuilder) => {
                isFirstEdit = false;

                if (isNextPartOfCodeBlock(currentText, codeBlock)) {
                  editBuilder.insert(
                    currentSelection.end,
                    codeBlock.slice(currentText.length)
                  );
                } else {
                  editBuilder.replace(currentSelection, codeBlock);
                }
              },
              { undoStopBefore: isFirstEdit, undoStopAfter: false }
            )
            .then((success: boolean) => {
              isUpdating = false;

              if (success) {
                currentSelection = new vscode.Range(
                  currentSelection.start,
                  editor.document.positionAt(
                    editor.document.offsetAt(currentSelection.start) +
                      codeBlock.length
                  )
                );
              }

              return success;
            });
        };

        // Disable vscode features while generating code
        const features = [
          { configName: "editor.quickSuggestions", originalValue: undefined },
          { configName: "editor.codeLens", originalValue: undefined },
        ];

        const vscodeConfig = vscode.workspace.getConfiguration();
        for (const feature of features) {
          feature.originalValue = vscodeConfig.get(feature.configName);
          vscodeConfig.update(feature.configName, false, true);
        }

        const result = await generateCode(
          extraInstructions,
          selection,
          editor,
          (result: CodeResult | null) => handleResult(result),
          token
        );

        while (isUpdating) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        handleTextToReplace(result);

        // Restore original settings
        for (const feature of features) {
          vscodeConfig.update(feature.configName, feature.originalValue, true);
        }
      }
    );
  }
};

const ensureCorrectLineEndings = (
  codeBlock: string,
  document: vscode.TextDocument
) => {
  if (document.eol === vscode.EndOfLine.LF) {
    codeBlock = codeBlock.replaceAll("\r\n", "\n");
  } else {
    codeBlock = codeBlock.replaceAll("\n", "\r\n");
  }

  return codeBlock;
};

const isNextPartOfCodeBlock = (currentText: string, codeBlock: string) => {
  if (codeBlock.length < currentText.length) {
    return false;
  }

  const oldText = codeBlock.slice(0, currentText.length);

  if (oldText !== currentText) {
    return false;
  }

  return true;
};
