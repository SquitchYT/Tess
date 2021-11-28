#ifndef INSTALLER
#define INSTALLER

#include <string>
#include <list>

#include "../Class/Extension.hpp"
#include "../Class/Loader.hpp"

#include "../Class/Error.hpp"

#include "../Utils/ProgressBar.hpp"

class Manager
{
public:
    Manager(std::vector<Extension> extensions, std::string action);

    Error start();

private:
    std::vector<Extension> _extension;
    std::string _action;

    std::string _status;
    std::string _item_name;

    // NEXT REPlACEMENT
    float _progress;
    std::string _details;

    int _do;
    int _todo;

    Loader _loader;

private:
    Error Install();

    // TODO
    Error Remove();
    Error Update();
};


#endif