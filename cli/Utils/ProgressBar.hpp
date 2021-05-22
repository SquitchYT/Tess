#ifndef PROGRESS
#define PROGRESS

#include <string>
#include <ostream>

class ProgressBar
{
    public:
        std::string _progressBar;

        ProgressBar(int len, int pourcent);

        friend std::ostream &operator<<(std::ostream &os, ProgressBar &bar);

        std::string str();
    
    private:
        int _totalChunk;
        int _activeChunk;
        int _inactiveChunk;
};

#endif