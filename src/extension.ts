import * as vscode from "vscode";
import debounce from "lodash.debounce";

const STATUS_BAR_COLOR = "#af2828";
const UNSAVED_COLOR = "yellow";

type ColorOptions =
  | {
      "statusBar.background": string;
      "statusBar.noFolderBackground": string;
      "statusBar.debuggingBackground": string;
    }
  | undefined;

function setHilight() {
  const currentColors: ColorOptions = vscode.workspace
    .getConfiguration("workbench")
    .get("colorCustomizations");

  const colors = Object.assign(currentColors || {}, {
    "statusBar.background": STATUS_BAR_COLOR,
    "statusBar.noFolderBackground": STATUS_BAR_COLOR,
    "statusBar.debuggingBackground": STATUS_BAR_COLOR
  });

  vscode.workspace
    .getConfiguration("workbench")
    .update("colorCustomizations", colors, true);
}

let STATUS_BAR_ITEM: vscode.StatusBarItem;

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
    setHilight();
    STATUS_BAR_ITEM.show();
  } else {
    resetColor();
    STATUS_BAR_ITEM.hide();
  }
}

const debouncedUpdate = debounce(updateColor, 500);

function createStatusBarItem() {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    99999999 // And you think z-index games are bad! :D
  );

  item.color = UNSAVED_COLOR;
  item.text = "UNSAVED";
  item.tooltip = "You have at least one unsaved file";
  item.hide();

  return item;
}

export function activate(context: vscode.ExtensionContext) {
  STATUS_BAR_ITEM = createStatusBarItem();

  const disposable = vscode.workspace.onDidChangeTextDocument(() => {
    debouncedUpdate();
  });

  context.subscriptions.push(STATUS_BAR_ITEM);
  context.subscriptions.push(disposable);
}

export function deactivate() {}
