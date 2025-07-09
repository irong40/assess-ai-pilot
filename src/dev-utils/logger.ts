import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'ERROR' | 'INPUT' | 'OUTPUT';
  message: string;
  data?: any;
  context?: string;
}

class DevelopmentLogger {
  private logDir = path.join(process.cwd(), 'dev-logs');
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  private maxLogFiles = 5;

  constructor() {
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `dev-${date}.log`);
  }

  private rotateLogsIfNeeded() {
    const currentLogFile = this.getCurrentLogFile();
    
    if (fs.existsSync(currentLogFile)) {
      const stats = fs.statSync(currentLogFile);
      if (stats.size > this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = path.join(this.logDir, `dev-${timestamp}.log`);
        fs.renameSync(currentLogFile, rotatedFile);
        this.cleanOldLogs();
      }
    }
  }

  private cleanOldLogs() {
    const files = fs.readdirSync(this.logDir)
      .filter(file => file.startsWith('dev-') && file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(this.logDir, file),
        mtime: fs.statSync(path.join(this.logDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length > this.maxLogFiles) {
      const filesToDelete = files.slice(this.maxLogFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
      });
    }
  }

  private writeLog(entry: LogEntry) {
    this.rotateLogsIfNeeded();
    const logFile = this.getCurrentLogFile();
    const logLine = `${entry.timestamp} [${entry.level}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}${entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : ''}\n\n`;
    
    fs.appendFileSync(logFile, logLine, 'utf8');
  }

  debug(message: string, data?: any, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      data,
      context
    });
  }

  info(message: string, data?: any, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data,
      context
    });
  }

  error(message: string, data?: any, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      data,
      context
    });
  }

  logInput(description: string, input: any, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INPUT',
      message: `Input: ${description}`,
      data: input,
      context
    });
  }

  logOutput(description: string, output: any, context?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'OUTPUT',
      message: `Output: ${description}`,
      data: output,
      context
    });
  }

  logErrorTrace(errorDescription: string, errorData: any, context?: string) {
    this.error(`Error Trace: ${errorDescription}`, {
      error: errorData,
      stack: errorData?.stack,
      timestamp: new Date().toISOString()
    }, context);
  }

  logFixAttempt(attemptNumber: number, description: string, changes: any, context?: string) {
    this.info(`Fix Attempt #${attemptNumber}: ${description}`, {
      changes,
      timestamp: new Date().toISOString()
    }, context);
  }

  readRecentLogs(lines: number = 50): string {
    const logFile = this.getCurrentLogFile();
    if (!fs.existsSync(logFile)) {
      return 'No logs found for today.';
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const logLines = content.split('\n').filter(line => line.trim());
    const recentLines = logLines.slice(-lines);
    return recentLines.join('\n');
  }

  searchLogs(searchTerm: string, days: number = 7): string[] {
    const results: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `dev-${dateStr}.log`);
      
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push(`${dateStr}:${index + 1}: ${line}`);
          }
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const devLogger = new DevelopmentLogger();

// Helper functions for common debugging scenarios
export const logApiCall = (url: string, method: string, payload?: any, response?: any) => {
  devLogger.logInput(`API Call: ${method} ${url}`, { method, url, payload }, 'API');
  if (response) {
    devLogger.logOutput(`API Response: ${method} ${url}`, response, 'API');
  }
};

export const logComponentRender = (componentName: string, props: any) => {
  devLogger.debug(`Rendering component: ${componentName}`, props, 'RENDER');
};

export const logStateChange = (stateName: string, oldValue: any, newValue: any, component?: string) => {
  devLogger.debug(`State change: ${stateName}`, { 
    old: oldValue, 
    new: newValue 
  }, component || 'STATE');
};

export const logUserAction = (action: string, data?: any) => {
  devLogger.info(`User action: ${action}`, data, 'USER');
};

export const startDebuggingSession = (sessionName: string) => {
  devLogger.info(`=== DEBUGGING SESSION STARTED: ${sessionName} ===`, {}, 'SESSION');
};

export const endDebuggingSession = (sessionName: string, outcome: string) => {
  devLogger.info(`=== DEBUGGING SESSION ENDED: ${sessionName} - ${outcome} ===`, {}, 'SESSION');
};