class BatchProcessor {
    constructor() {
        this.processes = [];
        this.currentBatch = 0;
        this.isProcessing = false;
        this.batchSize = 4;
        this.startTime = null;
        this.totalEstimatedTime = 0;
        this.globalStartTime = null;
        this.processedCount = 0;
    }

    addProcess(processData) {
        const newProcess = {
            id: this.processes.length + 1,
            programmerName: processData.programmerName,
            operation: processData.operation,
            data1: parseFloat(processData.data1),
            data2: parseFloat(processData.data2),
            estimatedTime: parseFloat(processData.estimatedTime),
            result: null,
            status: 'Pending'
        };
        this.processes.push(newProcess);
        return newProcess;
    }

    clearProcesses() {
        this.processes = [];
        this.currentBatch = 0;
        this.startTime = null;
        this.globalStartTime = null;
        this.totalEstimatedTime = 0;
        this.processedCount = 0;
        document.getElementById('elapsed-time').textContent = '00:00';
        document.getElementById('time-left').textContent = '00:00';
        document.getElementById('total-time').textContent = '00:00';
        document.getElementById('pending-lots').textContent = '0';
        document.getElementById('process-time').textContent = '0.00s';
        document.getElementById('global-time').textContent = '00:00';
    }

    async processBatch() {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.globalStartTime = Date.now();
            this.totalEstimatedTime = this.processes.reduce((sum, p) => sum + p.estimatedTime, 0);
        }
        this.isProcessing = true;
        this.processedCount = 0;

        const startIndex = this.currentBatch * this.batchSize;
        const endIndex = Math.min(startIndex + this.batchSize, this.processes.length);

        for (let i = startIndex; i < endIndex; i++) {
            const process = this.processes[i];
            process.status = 'Processing';
            this.updateUI();

            try {
                await this.simulateProcessing(process);
                process.result = this.performOperation(process);
                process.status = 'Completed';
                this.processedCount++;
            } catch (error) {
                process.status = 'Failed';
                process.result = error.message;
            }

            this.updateUI();
        }

        this.currentBatch++;
        this.isProcessing = false;
    }

    simulateProcessing(process) {
        return new Promise(resolve => {
            setTimeout(resolve, process.estimatedTime * 1000);
        });
    }

    performOperation(process) {
        const { operation, data1, data2 } = process;
        switch (operation) {
            case '+': return data1 + data2;
            case '-': return data1 - data2;
            case '*': return data1 * data2;
            case '/': 
                if (data2 === 0) throw new Error('Division by zero');
                return data1 / data2;
            case 'residue': return data1 % data2;
            case 'potency': return Math.pow(data1, data2);
            default: throw new Error('Invalid operation');
        }
    }

    updateUI() {
        // Update counters and metrics
        if (this.startTime) {
            // Pending lots counter
            const pending = this.processes.length - this.processedCount;
            document.getElementById('pending-lots').textContent = pending;

            // Process time metrics
            const currentProcess = this.processes[this.processedCount];
            if (currentProcess) {
                document.getElementById('process-time').textContent = 
                    `${currentProcess.estimatedTime.toFixed(2)}s`;
            }

            // Global processing time
            const globalElapsed = (Date.now() - this.globalStartTime) / 1000;
            const globalMinutes = Math.floor(globalElapsed / 60);
            const globalSeconds = Math.floor(globalElapsed % 60);
            document.getElementById('global-time').textContent = 
                `${String(globalMinutes).padStart(2, '0')}:${String(globalSeconds).padStart(2, '0')}`;

            // Existing time counters
            const elapsed = (Date.now() - this.startTime) / 1000;
            const elapsedMinutes = Math.floor(elapsed / 60);
            const elapsedSeconds = Math.floor(elapsed % 60);
            document.getElementById('elapsed-time').textContent = 
                `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;

            const totalMinutes = Math.floor(this.totalEstimatedTime / 60);
            const totalSeconds = Math.floor(this.totalEstimatedTime % 60);
            document.getElementById('total-time').textContent = 
                `${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`;

            const timeLeft = Math.max(0, this.totalEstimatedTime - elapsed);
            const leftMinutes = Math.floor(timeLeft / 60);
            const leftSeconds = Math.floor(timeLeft % 60);
            document.getElementById('time-left').textContent = 
                `${String(leftMinutes).padStart(2, '0')}:${String(leftSeconds).padStart(2, '0')}`;
        }

        // Update progress bar
        const totalBatches = Math.ceil(this.processes.length / this.batchSize);
        const currentProgress = this.isProcessing ? 
            (this.currentBatch / totalBatches) + 
            (1 / totalBatches * (this.processes.length % this.batchSize / this.batchSize)) :
            (this.currentBatch / totalBatches);
        
        const progress = Math.min(currentProgress * 100, 100);
        document.querySelector('.progress-fill').style.width = `${progress}%`;

        // Update batch status
        const statusText = `Batch ${Math.min(this.currentBatch + 1, totalBatches)} of ${totalBatches}`;
        document.querySelector('.batch-status').textContent = statusText;

        // Update results table
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = this.processes
            .map(process => `
                <tr>
                    <td>${process.id}</td>
                    <td>${process.programmerName}</td>
                    <td>${process.operation}</td>
                    <td>${process.data1}</td>
                    <td>${process.data2}</td>
                    <td>${process.result ?? ''}</td>
                    <td class="status-${process.status.toLowerCase()}">${process.status}</td>
                </tr>
            `)
            .join('');
    }
}

// UI Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    const processor = new BatchProcessor();
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const processForm = document.querySelector('.process-input');
    const addProcessBtn = document.getElementById('add-process');
    const clearBtn = document.getElementById('clear-btn');

    addProcessBtn.addEventListener('click', () => {
        const processData = {
            programmerName: document.getElementById('programmer-name').value,
            operation: document.getElementById('operation').value,
            data1: document.getElementById('data1').value,
            data2: document.getElementById('data2').value,
            estimatedTime: document.getElementById('estimated-time').value
        };

        if (!processData.programmerName || !processData.operation || 
            isNaN(processData.data1) || isNaN(processData.data2) || 
            isNaN(processData.estimatedTime)) {
            alert('Please fill all fields with valid values');
            return;
        }

        processor.addProcess(processData);
        startBtn.disabled = false;
        processor.updateUI();
        
        // Clear input fields
        document.getElementById('programmer-name').value = '';
        document.getElementById('data1').value = '';
        document.getElementById('data2').value = '';
        document.getElementById('estimated-time').value = '';
    });

    clearBtn.addEventListener('click', () => {
        processor.clearProcesses();
        startBtn.disabled = true;
        processor.updateUI();
    });

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        while (processor.currentBatch * processor.batchSize < processor.processes.length) {
            if (!processor.isProcessing) {
                await processor.processBatch();
            }
        }
        // Final UI update after all batches complete
        processor.updateUI();

        stopBtn.disabled = true;
    });

    stopBtn.addEventListener('click', () => {
        processor.isProcessing = false;
        stopBtn.disabled = true;
        startBtn.disabled = false;
    });
});
