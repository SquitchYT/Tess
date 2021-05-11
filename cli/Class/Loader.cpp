#include "Loader.hpp"

#include <ostream>
#include <string>

#include "../Utils/Constant.hpp"

Loader::Loader(){
    _current = 0;
}

void Loader::UpdateCurrent(){
    if (_current == 3) {
        _current = 0;
    } else {
        _current++;
    }
}

std::ostream &operator<<(std::ostream &os, Loader &loader){
    os << COLOR_BLUE << LOADERS[loader._current] << COLOR_DEFAULT;

    loader.UpdateCurrent();

    return os;
}