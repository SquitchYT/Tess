#ifndef EXTENTION
#define EXTENTION

#include <string>

#include <functional>
#include "../Lib/external/cpr/include/cpr/cpr.h"

#include "../Class/Error.hpp"


class Extention
{
private:
    std::string _name;
    std::string _type;
    std::string _url;
    std::string _content;
    
public:
    Extention(std::string name, std::string type);

    std::string getName();
    std::string getUrl();
    std::string getType();

    cpr::Response download(std::function<void (int)> callback);

    // Add a return value
    Error install(std::function<void (std::string, int)> callback);

    Error uninstall();

    // TODO
    // update
};


#endif