#include <iostream>
#include <vector>
#include <string>
#include <thread>
#include <chrono>
#include <fstream>
#include <sstream>
#include <cmath>
#include <filesystem>

using namespace std;

struct Process {
    int id;
    string programmerName;
    string operation;
    double data1;
    double data2;
    double estimatedTime;
    double result;
};

class BatchProcessing {
private:
    vector<Process> processes;
    int globalCounter = 0;

public:
    void addProcess(const Process& process) {
        processes.push_back(process);
    }

    void executeBatch() {
        const int batchSize = 4;
        const int totalBatches = (processes.size() + batchSize - 1) / batchSize;

        for (int i = 0; i < totalBatches; ++i) {
            cout << "Current Batch: " << (i + 1) << "/" << totalBatches << endl;
            cout << "Processes Executing:" << endl;

            for (size_t j = 0; j < batchSize && (i * batchSize + j) < processes.size(); ++j) {
                Process& p = processes[i * batchSize + j];
                cout << "ID: " << p.id << ", Operation: " << p.operation 
                     << ", Data1: " << p.data1 << ", Data2: " << p.data2 << endl;

                // Simulate processing time
                this_thread::sleep_for(chrono::milliseconds(static_cast<int>(p.estimatedTime * 1000)));
                p.result = performOperation(p.operation, p.data1, p.data2);
                globalCounter++;
                cout << "ID: " << p.id << ", Operation: " << p.operation << ", Result: " << p.result << endl;
            }
            cout << endl;
        }
    }

    double performOperation(const string& operation, double data1, double data2) {
        if (operation == "+") return data1 + data2;
        if (operation == "-") return data1 - data2;
        if (operation == "*") return data1 * data2;
        if (operation == "/") {
            if (data2 == 0) {
                cout << "Error: Division by zero\n";
                return 0;
            }
            return data1 / data2;
        }
        if (operation == "residue") return static_cast<int>(data1) % static_cast<int>(data2);
        if (operation == "potency") return pow(data1, data2);
        
        cout << "Error: Invalid operation\n";
        return 0;
    }

    void displayResults() {
        cout << "Total Processes Executed: " << globalCounter << endl;
    }

    bool loadFromFile(const string& filename) {
        if (!filesystem::exists(filename)) {
            cerr << "Error: File does not exist: " << filename << endl;
            return false;
        }

        ifstream file(filename);
        if (!file.is_open()) {
            cerr << "Error opening file: " << filename << endl;
            return false;
        }

        string line;
        int lineNum = 0;
        int processCount = 0;
        
        while (getline(file, line)) {
            lineNum++;
            line.erase(0, line.find_first_not_of(' '));
            if (line.empty() || line[0] == '#') continue;
            
            stringstream ss(line);
            string field;
            Process p;

            try {
                if (!getline(ss, field, ',')) throw invalid_argument("Missing ID");
                p.id = stoi(field);
                
                if (!getline(ss, p.programmerName, ',')) throw invalid_argument("Missing Programmer Name");
                if (!getline(ss, p.operation, ',')) throw invalid_argument("Missing Operation");
                if (!getline(ss, field, ',')) throw invalid_argument("Missing Data1");
                p.data1 = stod(field);
                if (!getline(ss, field, ',')) throw invalid_argument("Missing Data2");
                p.data2 = stod(field);
                if (!getline(ss, field)) throw invalid_argument("Missing Estimated Time");
                p.estimatedTime = stod(field);

                processes.push_back(p);
                processCount++;
            } catch (const invalid_argument& e) {
                cerr << "Error parsing line " << lineNum << ": " << e.what() << "\n";
                continue;
            } catch (const out_of_range& e) {
                cerr << "Error parsing line " << lineNum << ": " << e.what() << "\n";
                continue;
            }
        }

        file.close();
        if (processCount == 0) {
            cerr << "Warning: No valid processes were loaded from the file!" << endl;
        }
        return processCount > 0;
    }
};

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cerr << "Usage: " << argv[0] << " <input_file>\n";
        return 1;
    }

    BatchProcessing batch;
    if (!batch.loadFromFile(argv[1])) {
        return 1;
    }

    batch.executeBatch();
    batch.displayResults();

    return 0;
}
