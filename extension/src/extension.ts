import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const TEMPLATE_NAME = 'vex-competition';
const SKIP_ENTRIES = new Set(['.git', '.vsix', 'node_modules', 'out', 'build']);

export function activate(context: vscode.ExtensionContext) {
  // Register tree data providers
  const projectsProvider = new VexProjectsProvider(context);
  const devicesProvider = new VexDevicesProvider();

  vscode.window.registerTreeDataProvider('vexProjects', projectsProvider);
  vscode.window.registerTreeDataProvider('vexDevices', devicesProvider);

  // Register commands
  const createProject = vscode.commands.registerCommand(
    'axis.createVexCompetitionProject',
    async () => {
      const projectName = await promptForProjectName();
      if (!projectName) {
        return;
      }

      const destinationFolder = await promptForDestination();
      if (!destinationFolder) {
        return;
      }

      const targetPath = path.join(destinationFolder.fsPath, projectName);
      const templateRoot = context.asAbsolutePath(path.join('templates', TEMPLATE_NAME));

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Creating VEX project: ${projectName}`,
          },
          async () => {
            await ensureEmptyDirectory(targetPath);
            await copyDirectory(templateRoot, targetPath);
            await stampProjectMetadata(targetPath, projectName);
          }
        );

        const choice = await vscode.window.showInformationMessage(
          `Created VEX competition project at ${targetPath}.`,
          'Open Folder',
          'OK'
        );

        if (choice === 'Open Folder') {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(targetPath),
            true
          );
        }
        
        projectsProvider.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Unable to create project: ${message}`);
      }
    }
  );

  const openProject = vscode.commands.registerCommand(
    'axis.openProject',
    async (item: VexProjectItem) => {
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(item.projectPath),
        true
      );
    }
  );

  const refreshProjects = vscode.commands.registerCommand(
    'axis.refreshProjects',
    () => projectsProvider.refresh()
  );

  const buildProject = vscode.commands.registerCommand(
    'axis.buildProject',
    async (item: VexProjectItem) => {
      const terminal = vscode.window.createTerminal({
        name: 'VEX Build',
        cwd: item.projectPath
      });
      terminal.show();
      terminal.sendText('make');
    }
  );

  context.subscriptions.push(
    createProject,
    openProject,
    refreshProjects,
    buildProject
  );
}

// Projects Tree View Provider
class VexProjectsProvider implements vscode.TreeDataProvider<VexProjectItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<VexProjectItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: VexProjectItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: VexProjectItem): Promise<VexProjectItem[]> {
    if (element) {
      return [];
    }

    // Get recent projects from workspace state
    const recentProjects = this.context.workspaceState.get<string[]>('vexProjects', []);
    
    const projects: VexProjectItem[] = [];
    for (const projectPath of recentProjects) {
      if (await this.isVexProject(projectPath)) {
        const name = path.basename(projectPath);
        projects.push(new VexProjectItem(name, projectPath));
      }
    }

    // Add current workspace if it's a VEX project
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        if (await this.isVexProject(folder.uri.fsPath)) {
          const alreadyAdded = projects.some(p => p.projectPath === folder.uri.fsPath);
          if (!alreadyAdded) {
            projects.push(new VexProjectItem(folder.name, folder.uri.fsPath));
          }
        }
      }
    }

    if (projects.length === 0) {
      return [new VexProjectItem('No VEX projects found', '', true)];
    }

    return projects;
  }

  private async isVexProject(projectPath: string): Promise<boolean> {
    try {
      const makefilePath = path.join(projectPath, 'makefile');
      const vexDirPath = path.join(projectPath, 'vex');
      
      const [makefileExists, vexDirExists] = await Promise.all([
        fs.promises.access(makefilePath).then(() => true).catch(() => false),
        fs.promises.access(vexDirPath).then(() => true).catch(() => false)
      ]);
      
      return makefileExists && vexDirExists;
    } catch {
      return false;
    }
  }
}

class VexProjectItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly projectPath: string,
    private readonly isPlaceholder: boolean = false
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    
    if (!isPlaceholder) {
      this.tooltip = projectPath;
      this.description = projectPath;
      this.contextValue = 'vexProject';
      this.iconPath = new vscode.ThemeIcon('folder');
    } else {
      this.contextValue = 'placeholder';
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}

// Devices Tree View Provider
class VexDevicesProvider implements vscode.TreeDataProvider<VexDeviceItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<VexDeviceItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: VexDeviceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: VexDeviceItem): Promise<VexDeviceItem[]> {
    if (element) {
      return [];
    }

    // Placeholder - actual device detection would require native modules
    return [new VexDeviceItem('No devices connected', 'Connect a VEX V5 Brain')];
  }
}

class VexDeviceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = description;
    this.iconPath = new vscode.ThemeIcon('plug');
  }
}

// Helper functions (unchanged)
async function promptForProjectName(): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    prompt: 'Project folder name',
    value: 'vex-competition',
    validateInput: (input) => {
      if (!input.trim()) {
        return 'Please enter a project name.';
      }
      if (/[^A-Za-z0-9._-]/.test(input)) {
        return 'Use letters, numbers, dot, underscore, or dash only.';
      }
      return null;
    },
  });

  return value?.trim();
}

async function promptForDestination(): Promise<vscode.Uri | undefined> {
  const selection = await vscode.window.showOpenDialog({
    openLabel: 'Select destination',
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });

  return selection?.[0];
}

async function ensureEmptyDirectory(targetPath: string): Promise<void> {
  try {
    const stats = await fs.promises.stat(targetPath);
    if (!stats.isDirectory()) {
      throw new Error('Destination exists and is not a folder.');
    }

    const existing = await fs.promises.readdir(targetPath);
    if (existing.length > 0) {
      throw new Error('Destination folder is not empty.');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.promises.mkdir(targetPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  await fs.promises.mkdir(destination, { recursive: true });
  const entries = await fs.promises.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_ENTRIES.has(entry.name)) {
      continue;
    }

    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function stampProjectMetadata(targetPath: string, projectName: string): Promise<void> {
  const settingsPath = path.join(targetPath, '.vscode', 'vex_project_settings.json');
  try {
    const raw = await fs.promises.readFile(settingsPath, 'utf8');
    const data = JSON.parse(raw);

    if (data.project) {
      data.project.name = projectName;
      data.project.description = data.project.description || 'VEX Competition Project';
      data.project.creationDate = new Date().toLocaleString();
    }

    await fs.promises.writeFile(settingsPath, JSON.stringify(data, null, 2));
  } catch {
    // Ignore if the file is missing or malformed.
  }
}

export function deactivate() {
  // Nothing to clean up.
}

// compilerOptions
// "types": ["node"]
