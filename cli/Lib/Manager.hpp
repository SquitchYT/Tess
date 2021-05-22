#ifndef INSTALLER
#define INSTALLER

#include <string>
#include <list>

#include "../Class/extention.hpp"
#include "../Class/Loader.hpp"

#include "../Class/Error.hpp"

#include "../Utils/ProgressBar.hpp"

class Manager
{
public:
    Manager(std::list<Extention> extentions, std::string action);

    Error start();

private:
    std::list<Extention> _extention;
    std::string _action;

    std::string _status;
    std::string _item_name;

    // NEXT REPlACEMENT
    int _progress;
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