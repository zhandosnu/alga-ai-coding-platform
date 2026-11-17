import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  runtimeMs: number;
}

@Injectable()
export class DockerSandboxService {
  private readonly logger = new Logger(DockerSandboxService.name);
  private readonly timeoutMs: number;
  private readonly memoryMb: number;
  private readonly sandboxDir: string;

  constructor(private config: ConfigService) {
    this.timeoutMs = config.get<number>('SANDBOX_TIMEOUT_MS', 10000);
    this.memoryMb = config.get<number>('SANDBOX_MEMORY_MB', 256);
    this.sandboxDir = '/tmp/alga-sandbox';
    fs.mkdirSync(this.sandboxDir, { recursive: true });
  }

  async runCode(
    code: string,
    language: 'python' | 'cpp',
    stdin: string,
  ): Promise<SandboxResult> {
    const runId = uuidv4();
    const workDir = path.join(this.sandboxDir, runId);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // Write files
      const codeFile = language === 'python' ? 'solution.py' : 'solution.cpp';
      fs.writeFileSync(path.join(workDir, codeFile), code, 'utf8');
      fs.writeFileSync(path.join(workDir, 'stdin.txt'), stdin, 'utf8');

      if (language === 'python') {
        return await this.runPython(runId, workDir);
      } else {
        return await this.runCpp(runId, workDir);
      }
    } finally {
      // Cleanup
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  private runPython(runId: string, workDir: string): Promise<SandboxResult> {
    const image = this.config.get<string>('SANDBOX_PYTHON_IMAGE', 'alga-sandbox-python');
    const args = [
      'run', '--rm',
      '--name', `alga-sandbox-${runId}`,
      '--network', 'none',
      '--cpus', '0.5',
      '--memory', `${this.memoryMb}m`,
      '--memory-swap', `${this.memoryMb}m`,
      '--read-only',
      '--tmpfs', '/tmp:size=64m',
      '-v', `${workDir}:/code:ro`,
      image,
      'sh', '-c', 'python /code/solution.py < /code/stdin.txt',
    ];
    return this.spawnDocker(args, runId);
  }

  private runCpp(runId: string, workDir: string): Promise<SandboxResult> {
    const image = this.config.get<string>('SANDBOX_CPP_IMAGE', 'alga-sandbox-cpp');
    const args = [
      'run', '--rm',
      '--name', `alga-sandbox-${runId}`,
      '--network', 'none',
      '--cpus', '1.0',
      '--memory', `${this.memoryMb}m`,
      '--memory-swap', `${this.memoryMb}m`,
      '--read-only',
      '--tmpfs', '/tmp:size=128m,exec',   // exec needed so the compiled binary can run
      '-v', `${workDir}:/code:ro`,
      image,
      'sh', '-c',
      'g++ -O2 -std=c++17 -o /tmp/solution /code/solution.cpp && /tmp/solution < /code/stdin.txt',
    ];
    return this.spawnDocker(args, runId);
  }

  private spawnDocker(args: string[], runId: string): Promise<SandboxResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const proc = spawn('docker', args);

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGKILL');
        // Also kill docker container by name
        spawn('docker', ['kill', `alga-sandbox-${runId}`]).on('error', () => {});
      }, this.timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        const runtimeMs = Date.now() - start;
        resolve({
          stdout: stdout.slice(0, 65536), // max 64KB output
          stderr: stderr.slice(0, 8192),
          exitCode: code ?? -1,
          timedOut,
          runtimeMs,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        this.logger.error(`Docker spawn error: ${err.message}`);
        resolve({
          stdout: '',
          stderr: `System error: ${err.message}`,
          exitCode: -1,
          timedOut: false,
          runtimeMs: Date.now() - start,
        });
      });
    });
  }
}
