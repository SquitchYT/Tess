#ifndef ERRORTESS
#define ERRORTESS

#include <string>
#include <iostream>

#include "../Utils/Constants.hpp"

class Error
{
    private:
        int _code;
        std::string _message;

        bool _isNull;

    public:
        template<typename... ARGS>
        inline Error(std::pair<int, std::string> err_code, ARGS... more) {
            _code = err_code.first;
            _message = err_code.second;
            _isNull = (_code == ERR_NONE.first);

            ((_message += static_cast<std::string>(more) + " "), ...);
        };

        Error(std::pair<int, std::string> err_code);
        Error() = default ;

        friend std::ostream &operator<<(std::ostream &os, Error &err);

        int getCode();
        std::string getMessage();

        bool isNull();
};


#endif