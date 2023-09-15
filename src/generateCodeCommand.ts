import * as vscode from "vscode";
import { generateCode } from "./code-generation/codeGenerator";
import { CodeResult } from "./code-generation/CodeResult";

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

    // Clear current selection
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
        let lastUpdated = Date.now();
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
            },
            { undoStopBefore: false, undoStopAfter: false }
          );
        };

        const handleResult = (
          result: CodeResult | null,
          isPartialUpdate: boolean
        ) => {
          if (token.isCancellationRequested || !result || isUpdating) {
            return;
          }
          isUpdating = true;
          lastUpdated = Date.now();
          editor
            .edit(
              (editBuilder) => {
                if (result.modifiedQuery) {
                  progress.report({ message: result.modifiedQuery });
                }

                isFirstEdit = false;

                const currentText = editor.document.getText(currentSelection);
                let codeBlock = ensureLineEndings(
                  result.codeBlock,
                  editor.document
                );

                if (isNextPartOfCodeBlock(currentText, codeBlock)) {
                  editBuilder.insert(
                    currentSelection.end,
                    codeBlock.slice(currentText.length)
                  );
                } else {
                  editBuilder.replace(currentSelection, codeBlock);
                }

                currentSelection = new vscode.Range(
                  currentSelection.start,
                  new vscode.Position(
                    currentSelection.start.line +
                      codeBlock.split("\n").length -
                      1,
                    codeBlock.split("\n").at(-1)!.length
                  )
                );
              },
              { undoStopBefore: isFirstEdit, undoStopAfter: false }
            )
            .then(() => {
              isUpdating = false;
            });
        };

        const result = await generateCode(
          extraInstructions,
          selection,
          editor,
          (result: CodeResult | null) => handleResult(result, true),
          token
        );

        // TODO: Make good without this hack

        lastUpdated = 0;
        isUpdating = false;
        await new Promise((resolve) => setTimeout(resolve, 300));
        handleTextToReplace(result).then(() => handleResult(result, false));
        await new Promise((resolve) => setTimeout(resolve, 300));
        handleTextToReplace(result).then(() => handleResult(result, false));
      }
    );
  }
};

const ensureLineEndings = (
  codeBlock: string,
  document: vscode.TextDocument
) => {
  if (document.eol === vscode.EndOfLine.LF) {
    codeBlock = codeBlock.replaceAll(/\r\n/g, "\n");
  } else {
    codeBlock = codeBlock.replaceAll(/\n/g, "\r\n");
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
