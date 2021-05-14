#include "ProgressBar.hpp"

#include <iostream>
#include <string>

#include "Constant.hpp"

ProgressBar::ProgressBar(int len, int pourcent) {
    pourcent = (pourcent < 0) ? 0 : pourcent;
    _totalChunk = len - 7;
    _activeChunk = float(pourcent) / 100 * float((len - 7));
    _inactiveChunk = _totalChunk - _activeChunk;

    switch (std::to_string(pourcent).length())
    {
        case 1:
            _progressBar = "  ";
            break;
        case 2:
            _progressBar = " ";
            break;
        default:
            break;
    }

    _progressBar += std::to_string(pourcent) + "% [" + COLOR_GREEN;

    //try to replace with only one for loop
    for (_activeChunk; _activeChunk != 0; _activeChunk--) {
        _progressBar += "█";
    }
    _progressBar += COLOR_ERR;
    for (_inactiveChunk; _inactiveChunk != 0; _inactiveChunk--) {
        _progressBar += "█";
    }
    _progressBar += COLOR_DEFAULT + "]";
}

std::ostream &operator<<(std::ostream &os, ProgressBar &bar) {
    os << bar._progressBar;

    return os;
}