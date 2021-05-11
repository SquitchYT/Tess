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

    int _download_progress;
    int _install_progress;

    int _installed;
    int _to_install;

    Loader _loader;
    
    std::string _install_details;
    std::string _remove_details;

    int _to_remove;
    int _removed;

private:
    std::pair<int, std::string> Install();

    // TODO
    std::pair<int, std::string> Remove();
    std::pair<int, std::string> Update();
};


#endif