# YOU HAVE UNSAVED FILES

I think Visual Studio Code does not make it clear enough when you have usaved
files. This extension tries to make it more clear!

![screenshot](https://raw.githubusercontent.com/epeli/vscode-unsaved/master/screenshot.png)

This especially useful when [working without tabs](https://code.visualstudio.com/docs/getstarted/userinterface#_working-without-tabs).

### Caveat

This extension edits the `colorCustomizations` option fields
`statusBar.background`, `statusBar.noFolderBackground` and
`statusBar.debuggingBackground` so beaware that those will reset if you have
customized them.
