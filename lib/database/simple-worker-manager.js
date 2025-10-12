// lib/database/simple-worker-manager.js
export class SimpleWorkerManager {
  constructor() {
    this.worker = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  async initialize() {
    if (this.worker) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/db-worker.js');

        this.worker.onmessage = (e) => {
          const { id, success, result, error } = e.data;
          const request = this.pendingRequests.get(id);

          if (request) {
            this.pendingRequests.delete(id);
            if (success) {
              request.resolve(result);
            } else {
              request.reject(new Error(error));
            }
          }
        };

        this.worker.onerror = (e) => {
          this.rejectAllRequests(new Error(`Worker error: ${e.message}`));
          reject(new Error(`Worker error: ${e.message}`));
        };

        resolve();
      } catch (err) {
        reject(new Error(`Failed to create worker: ${err.message}`));
      }
    });
  }

  async sendCommand(command, data = {}, timeout = 30000) {
    if (!this.worker) {
      throw new Error('Worker not initialized --', command);
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${command}`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      try {
        this.worker.postMessage({ id, command, data });
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  rejectAllRequests(error) {
    this.pendingRequests.forEach(({ reject }) => reject(error));
    this.pendingRequests.clear();
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.rejectAllRequests(new Error('Worker terminated'));
  }
}