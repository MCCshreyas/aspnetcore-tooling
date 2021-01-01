/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as net from 'net';
import * as vscode from 'vscode';

import { RazorLogger } from '../RazorLogger';
import { JS_DEBUG_NAME, SERVER_APP_NAME } from './Constants';
import { onDidTerminateDebugSession } from './TerminateDebugHandler';

export class BlazorDebugConfigurationProvider implements vscode.DebugConfigurationProvider {

    constructor(private readonly logger: RazorLogger, private readonly vscodeType: typeof vscode) { }

    public async resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, configuration: vscode.DebugConfiguration): Promise<vscode.DebugConfiguration | undefined> {
        /**
         * The Blazor WebAssembly app should only be launched if the
         * launch configuration is a launch request. Attach requests will
         * only launch the browser.
         */
        if (configuration.request === 'launch') {
            await this.launchApp(folder, configuration);
        }

        const debuggingPort = await this.getAvailablePort(9222);
        const url = await vscode.commands.executeCommand<string>('ms-blazorwasm-companion.launchDebugProxy', '5.0.0', `http://localhost:${debuggingPort}`);
        if (url) {
            await this.launchBrowser(folder, configuration, url.replace('http', 'ws').replace('127.0.0.1', 'localhost'), debuggingPort);
        }

        const terminateDebugProxy = this.vscodeType.debug.onDidTerminateDebugSession(async event => {
            if (event.name === JS_DEBUG_NAME || event.name === SERVER_APP_NAME) {
                await vscode.commands.executeCommand('ms-blazorwasm-companion.killDebugProxy', url);
                terminateDebugProxy.dispose();
            }
        });

        /**
         * If `resolveDebugConfiguration` returns undefined, then the debugger
         * launch is canceled. Here, we opt to manually launch the browser
         * configuration using `startDebugging` above instead of returning
         * the configuration to avoid a bug where VS Code is unable to resolve
         * the debug adapter for the browser debugger.
         */
        return undefined;
    }

    private async launchApp(folder: vscode.WorkspaceFolder | undefined, configuration: vscode.DebugConfiguration) {
        const program = configuration.hosted ? configuration.program : 'dotnet';
        const cwd = configuration.cwd || '${workspaceFolder}';
        const args = configuration.hosted ? [] : ['run'];

        const app = {
            name: SERVER_APP_NAME,
            type: 'coreclr',
            request: 'launch',
            prelaunchTask: 'build',
            program,
            args,
            cwd,
            env: {
                ASPNETCORE_ENVIRONMENT: 'Development',
                ...configuration.env,
            },
            launchBrowser: {
                enabled: false,
            },
            ...configuration.dotNetConfig,
        };

        try {
            await this.vscodeType.debug.startDebugging(folder, app);
            if (process.platform !== 'win32') {
                const terminate = this.vscodeType.debug.onDidTerminateDebugSession(async event => {
                    const blazorDevServer = 'blazor-devserver.dll';
                    const dir = folder && folder.uri && folder.uri.fsPath;
                    const launchedApp = configuration.hosted ? app.program : `${dir}.*${blazorDevServer}|${blazorDevServer}.*${dir}`;
                    await onDidTerminateDebugSession(event, this.logger, launchedApp);
                    terminate.dispose();
                });
            }
        } catch (error) {
            this.logger.logError('[DEBUGGER] Error when launching application: ', error);
        }
    }

    private async launchBrowser(folder: vscode.WorkspaceFolder | undefined, configuration: vscode.DebugConfiguration, wsAddress?: string, debuggingPort?: number, localPath?: string) {
        const inspectUri = `${wsAddress}{browserInspectUriPath}`;
        const browser = {
            name: JS_DEBUG_NAME,
            type: configuration.browser === 'edge' ? 'pwa-msedge' : 'pwa-chrome',
            request: 'launch',
            timeout: configuration.timeout || 30000,
            url: configuration.url || 'https://localhost:5001',
            webRoot: configuration.webRoot || '${workspaceFolder}',
            inspectUri,
            trace: configuration.trace || false,
            noDebug: configuration.noDebug || false,
            port: debuggingPort,
            runtimeArgs: [`--remote-debugging-port=${debuggingPort}`],
            ...configuration.browserConfig
        };

        try {
            /**
             * The browser debugger will immediately launch after the
             * application process is started. It waits a `timeout`
             * interval before crashing after being unable to find the launched
             * process.
             *
             * We do this to provide immediate visual feedback to the user
             * that their debugger session has started.
             */
            await this.vscodeType.debug.startDebugging(folder, browser);
        } catch (error) {
            this.logger.logError(
                '[DEBUGGER] Error when launching browser debugger: ',
                error,
            );
            const message = `There was an unexpected error while launching your debugging session. Check the console for helpful logs and visit the debugging docs for more info.`;
            this.vscodeType.window.showErrorMessage(message, `View Debug Docs`, `Ignore`).then(async result => {
                if (result === 'View Debug Docs') {
                    const debugDocsUri = 'https://aka.ms/blazorwasmcodedebug';
                    await this.vscodeType.commands.executeCommand(`vcode.open`, debugDocsUri);
                }
            });
        }
    }

    private getAvailablePort(initialPort: number) {
        function getNextAvailablePort(currentPort: number, cb: (port: number) => void) {
            const server = net.createServer();
            server.listen(currentPort, () => {
                server.once('close', () => {
                    cb(currentPort);
                });
                server.close();
            });
            server.on('error', () => {
                getNextAvailablePort(++currentPort, cb);
            });
        }

        return new Promise<number>(resolve => {
            getNextAvailablePort(initialPort, resolve);
        });
    }

    // private setPathMappings(folder: vscode.WorkspaceFolder | undefined, launchConfig: any, localPath?: string) {
    //     // remoteName is set when connected to a remote
    //     if (typeof vscode.env.remoteName !== 'undefined') {
    //         const remoteRoot = folder && folder.uri && folder.uri.fsPath;
    //         // const hash = crypto.createHash('md5').update(remoteRoot).digest('hex');
    //         launchConfig.webRoot = `${localPath}/testdirectory`;
    //         launchConfig.sourceMapPathOverrides = {
    //             [`${remoteRoot}*`]: `${localPath}*`,
    //         };
    //         // launchConfig.pathMappings = ""
    //         // launchConfig.__remoteFilePrefix =
    //     }
    //     return launchConfig;
    // }
}
