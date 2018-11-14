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

function getDelay(): number {
    const config: any = vscode.workspace.getConfiguration().get("usaved");

    if (config && config.delay) {
        return config.delay;
    }

    return 1000;
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

    delay = getDelay();

    debouncedStatusBarHighlightUpdate = debounce(
        this.updateStatusBarHighlight,
        this.delay,
    );

    debouncedStatusBarItemUpdate = debounce(this.updateStatusBarItem, 200);

    constructor() {
        this.updateStatusBarHighlight();
        this.updateStatusBarItem();
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
        if (String(this.delay) === "0") {
            return;
        }

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

class DisposableHolder {
    disposable: { dispose: Function };

    constructor(disposable: { dispose: Function }) {
        this.disposable = disposable;
    }

    dispose() {
        this.disposable.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    let tracker = new UnsavedTracker();
    const holder = new DisposableHolder(tracker);
    context.subscriptions.push(holder);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            const newDelay = getDelay();
            if (tracker.delay !== newDelay) {
                console.log(
                    "esamatti.unsaved config changed. Creating new tracker with delay " +
                        newDelay,
                );
                holder.disposable.dispose();
                holder.disposable = new UnsavedTracker();
            }
        }),
    );
}
