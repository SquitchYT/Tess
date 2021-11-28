#ifndef EXTENSION
#define EXTENSION

#include <string>

#include <functional>
#include <cpr/cpr.h>

#include "../Class/Error.hpp"

class Extension
{
private:
    std::string _name;
    std::string _type;
    std::string _url;
    std::string _content;
    
public:
    Extension(std::string name, std::string type);

    std::string getName();
    std::string getUrl();
    std::string getType();

    cpr::Response download(std::function<void (int)> callback);

    Error install(std::function<void (std::string, float)> callback);

    // Add a return value for progress ?
    Error uninstall();

    // TODO
    // update
};


#endif