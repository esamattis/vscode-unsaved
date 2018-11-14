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
        99999999, // And you think z-index games are bad! :D
    );

    item.color = UNSAVED_COLOR;
    item.text = "UNSAVED";
    item.tooltip = "You have at least one unsaved file. Click to save all.";
    item.command = "workbench.action.files.saveAll";
    item.hide();

    return item;
}

class UnsavedTracker {
    statusBarItem = createStatusBarItem();
    workbenchConfig = vscode.workspace.getConfiguration("workbench");

    changeListener = vscode.workspace.onDidChangeTextDocument(() => {
        this.debouncedStatusBarHighlightUpdate();
        this.debouncedStatusBarItemUpdate();
    });

    saveListener = vscode.workspace.onDidSaveTextDocument(() => {
        this.debouncedStatusBarHighlightUpdate.cancel();
        this.debouncedStatusBarItemUpdate.cancel();
        this.updateStatusBarHighlight();
        this.updateStatusBarItem();
    });

    debouncedStatusBarHighlightUpdate = debounce(
        this.updateStatusBarHighlight,
        this.getDelay(),
    );

    debouncedStatusBarItemUpdate = debounce(this.updateStatusBarItem, 200);

    getDelay() {
        const config: any = vscode.workspace.getConfiguration().get("usaved");

        if (config && config.delay) {
            return config.delay;
        }

        return 1000;
    }

    hasUnsavedFiles() {
        return vscode.workspace.textDocuments.some(editor => editor.isDirty);
    }

    updateStatusBarItem() {
        if (this.hasUnsavedFiles()) {
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    updateStatusBarHighlight() {
        if (this.hasUnsavedFiles()) {
            this.activateStatusBarHighlight();
        } else {
            this.resetStatusBarHighlight();
        }
    }

    activateStatusBarHighlight() {
        const currentColors: ColorOptions = this.workbenchConfig.get(
            "colorCustomizations",
        );

        const colors = Object.assign(currentColors || {}, {
            "statusBar.background": STATUS_BAR_COLOR,
            "statusBar.noFolderBackground": STATUS_BAR_COLOR,
            "statusBar.debuggingBackground": STATUS_BAR_COLOR,
        });

        this.workbenchConfig.update("colorCustomizations", colors, true);
    }

    resetStatusBarHighlight() {
        const colors: ColorOptions = this.workbenchConfig.get(
            "colorCustomizations",
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
        this.debouncedStatusBarHighlightUpdate.cancel();
        this.debouncedStatusBarItemUpdate.cancel();
        this.statusBarItem.dispose();
        this.changeListener.dispose();
        this.saveListener.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(new UnsavedTracker());
}
