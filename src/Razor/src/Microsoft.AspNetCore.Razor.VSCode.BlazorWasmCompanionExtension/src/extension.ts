import * as vscode from 'vscode';
import { LocalDebugProxyManager } from './LocalDebugProxyManager';
import { spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel("Blazor WASM Debug Proxy");
    const pidsByUrl = new Map<string, number>();

    const launchDebugProxy = vscode.commands.registerCommand('ms-blazorwasm-companion.launchDebugProxy', async (version = "5.0.0", debuggingHost = 'http://localhost:9222') => {
        try {
            const localDebugProxyManager = new LocalDebugProxyManager();

            const debugProxyLocalPath = await localDebugProxyManager.getDebugProxyLocalNugetPath(version);
            outputChannel.appendLine(`Launching debugging proxy from ${debugProxyLocalPath}/tools/BlazorDebugProxy/BrowserDebugHost.dll`);
            const spawnedProxy = spawn('dotnet', ['exec', `${debugProxyLocalPath}/tools/BlazorDebugProxy/BrowserDebugHost.dll`, '--DevToolsUrl', debuggingHost]);

            for await (const output of spawnedProxy.stdout) {
                outputChannel.appendLine(output);
                const matchExpr = "Now listening on: (?<url>.*)";
                const found = `${output}`.match(matchExpr);
                const url = found?.groups?.url;
                if (url) {
                    outputChannel.appendLine(url);
                    pidsByUrl.set(url, spawnedProxy.pid);
                    return url;
                }
            }

            return;
        } catch (error) {
            outputChannel.appendLine(error);
        }
    });

    const killDebugProxy = vscode.commands.registerCommand('ms-blazorwasm-companion.killDebugProxy', (url: string) => {
        const pid = pidsByUrl.get(url);
        if (pid) {
            outputChannel.appendLine(`Terminating debug proxy server running at ${url} with PID ${pid}`);
            process.kill(pid);
        }
    });


    context.subscriptions.push(launchDebugProxy, killDebugProxy);
}

// this method is called when your extension is deactivated
export function deactivate() { }
