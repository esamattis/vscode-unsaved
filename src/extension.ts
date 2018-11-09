import * as vscode from "vscode";
import debounce from "lodash.debounce";

type ColorOptions =
  | {
      "statusBar.background": string;
      "statusBar.noFolderBackground": string;
      "statusBar.debuggingBackground": string;
    }
  | undefined;

function setColor(background: string) {
  const currentColors: ColorOptions = vscode.workspace
    .getConfiguration("workbench")
    .get("colorCustomizations");

  const colors = Object.assign(currentColors || {}, {
    "statusBar.background": background,
    "statusBar.noFolderBackground": background,
    "statusBar.debuggingBackground": background
  });

  vscode.workspace
    .getConfiguration("workbench")
    .update("colorCustomizations", colors, true);
}

function resetColor() {
  const colors: ColorOptions = vscode.workspace
    .getConfiguration("workbench")
    .get("colorCustomizations");

  if (!colors) {
    return;
  }

  delete colors["statusBar.background"];
  delete colors["statusBar.noFolderBackground"];
  delete colors["statusBar.debuggingBackground"];

  vscode.workspace
    .getConfiguration("workbench")
    .update("colorCustomizations", colors, true);
}

function updateColor() {
  const hasDirty = vscode.workspace.textDocuments.some(
    editor => editor.isDirty
  );

  if (hasDirty) {
    setColor("#E2A1C2");
  } else {
    resetColor();
  }
}

const debouncedUpdate = debounce(updateColor, 500);

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument(() => {
    debouncedUpdate();
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
