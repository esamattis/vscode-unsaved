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

class UnsavedTracker {
  statusBarItem = createStatusBarItem();
  workbenchConfig = vscode.workspace.getConfiguration("workbench");

  listener = vscode.workspace.onDidChangeTextDocument(
    debounce(this.updateColor.bind(this), 600)
  );

  updateColor() {
    const hasUnsavedFiles = vscode.workspace.textDocuments.some(
      editor => editor.isDirty
    );

    if (hasUnsavedFiles) {
      this.activateStatusBarHilight();
      this.statusBarItem.show();
    } else {
      this.resetStatusBarHilight();
      this.statusBarItem.hide();
    }
  }

  activateStatusBarHilight() {
    const currentColors: ColorOptions = this.workbenchConfig.get(
      "colorCustomizations"
    );

    const colors = Object.assign(currentColors || {}, {
      "statusBar.background": STATUS_BAR_COLOR,
      "statusBar.noFolderBackground": STATUS_BAR_COLOR,
      "statusBar.debuggingBackground": STATUS_BAR_COLOR
    });

    this.workbenchConfig.update("colorCustomizations", colors, true);
  }

  resetStatusBarHilight() {
    const colors: ColorOptions = this.workbenchConfig.get(
      "colorCustomizations"
    );

    if (!colors) {
      return;
    }

    delete colors["statusBar.background"];
    delete colors["statusBar.noFolderBackground"];
    delete colors["statusBar.debuggingBackground"];

    this.workbenchConfig.update("colorCustomizations", colors, true);
  }

  dispose() {
    this.statusBarItem.dispose();
    this.listener.dispose();
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new UnsavedTracker());
}
