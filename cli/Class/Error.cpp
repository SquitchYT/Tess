#include "Error.hpp"

#include <iostream>
#include <string>

#include "../Utils/Constant.hpp"

Error::Error(std::pair<int, std::string> err_code) {
    _code = err_code.first;
    _message = err_code.second;
    _isNull = (_code == ERR_NONE.first);
}

std::ostream &operator<<(std::ostream &os, Error &err)
{
    if (!err.isNull()) {
        os << COLOR_ERR << "Error: " << err._message << COLOR_DEFAULT;
    }
    return os;
}

int Error::getCode()
{
    return _code;
}

std::string Error::getMessage()
{
    return _message;
}

bool Error::isNull() {
    return _isNull;
}


