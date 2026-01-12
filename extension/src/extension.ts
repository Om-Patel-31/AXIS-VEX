import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const TEMPLATE_NAME = 'vex-competition';
const SKIP_ENTRIES = new Set(['.git', '.vsix', 'node_modules', 'out', 'build']);

export function activate(context: vscode.ExtensionContext) {
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
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Unable to create project: ${message}`);
      }
    }
  );

  context.subscriptions.push(createProject);
}

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
