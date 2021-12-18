#include "ProgressBar.hpp"

#include <iostream>
#include <string>

#include "Constants.hpp"

ProgressBar::ProgressBar(int len, float pourcent) {
    len = len * BAR_ELEMENTS.size();
    pourcent = (pourcent < 0) ? 0 : pourcent;
    _totalChunk = len - 7 * 8;
    _activeChunk = static_cast<float>(pourcent) / 100 * static_cast<float>((len - 7 * 8));
    _inactiveChunk = _totalChunk - _activeChunk;

    switch (std::to_string(int(pourcent)).length())
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

    if (pourcent == 0) {
        _progressBar += std::to_string(int(pourcent)) + "% [" + COLOR_GREEN;
    } else {
        _progressBar += std::to_string(int(pourcent)) + "% " + COLOR_GREEN + "[";
    }

    _progressBar += COLOR_GREEN;

    while (_activeChunk > BAR_ELEMENTS.size()) {
        _activeChunk -= BAR_ELEMENTS.size();
        _progressBar += BAR_ELEMENTS[BAR_ELEMENTS.size() - 1];
    }

    if (_activeChunk > 0) {
        _progressBar += BAR_ELEMENTS[_activeChunk - 1];
    }

    while (_inactiveChunk >= BAR_ELEMENTS.size())
    {
        _inactiveChunk -= BAR_ELEMENTS.size();
        _progressBar += " ";
    }
    

    if (pourcent == 100) {
        _progressBar += "]" + COLOR_DEFAULT;
    } else {
        _progressBar += COLOR_DEFAULT + "]";
    }
}

std::ostream &operator<<(std::ostream &os, ProgressBar &bar) {
    os << bar._progressBar;

    return os;
}

std::string ProgressBar::str() {
    return _progressBar;
}