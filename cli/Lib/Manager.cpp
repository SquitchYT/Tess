#include "Manager.hpp"

#include <iostream>

#ifdef __linux__
#include <unistd.h>
#endif
#include <string>
#include <future>
#include <thread>
#include <list>
#include <vector>

#ifdef _WIN32
    #include <Windows.h>
#endif

#include "../Utils/ProgressBar.hpp"
#include "../Utils/Constant.hpp"
#include "../Utils/cross.hpp"

#include "../Class/Extension.hpp"
#include "../Class/Loader.hpp"
#include "../Class/Error.hpp"


Manager::Manager(std::vector<Extension> extensions, std::string action){
    _extension = extensions;
    _action = action;
    _status = STATUS_WAITING;
}

Error Manager::start(){
    #ifdef _WIN32
        SetConsoleOutputCP(CP_UTF8);
    #endif
    std::future<Error> download;

    // Try to switch !!! to switch
    if (_action == "install") {
        download = std::async(std::launch::async, &Manager::Install, this);
    } else if (_action == "remove") {
        download = std::async(std::launch::async, &Manager::Remove, this);
    } else if (_action == "update") {
        download = std::async(std::launch::async, &Manager::Update, this);
    } else {
        Error err(ERR_DISK);
        return err;
    }

    while (_status != STATUS_FINISHED)
    {
        auto [cols, rows] = Utils::Cross::getTerminalSize();
        int progressBarLenght = cols * 3 / 7;

        if (_status == STATUS_DOWNLOADING) {
            ProgressBar bar(progressBarLenght, _progress);

            std::string out = " " + _item_name;
            for (int i = out.size(); i != cols - 1 - progressBarLenght; i++) {
                out += " ";
            }
            out += bar.str();

            std::cout << "\r" << _loader << out << std::flush;

            if (_progress == 100) {
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << out << std::endl;
                _status = STATUS_WAITING;
            } else if (_progress == -1) {
                std::cout << "\r" << COLOR_ERR << "✖" << COLOR_DEFAULT << out << std::endl;
                _status = STATUS_WAITING;
            }
        }
        // Installing section
        else if (_status == STATUS_INSTALLING) {
            ProgressBar bar(progressBarLenght, _progress);

            std::string out = " (" + std::to_string(static_cast<int>(_do + 1)) + "/" + std::to_string(_todo) + ") " + _details;
            for (int i = out.size(); i != cols - 1 - progressBarLenght; i++) {
                out += " ";
            }
            out += (_progress >= 0) ? bar.str() : "";
            for (int i = out.size(); i < cols - 1; i++) {
                out += " ";
            }

            std::cout << "\r" << _loader << out << std::flush;

            if (_details == "Finish") {
                std::string output = " (" + std::to_string(_do) + "/" + std::to_string(_todo) + ") " + _item_name + " Installed!";
                for (int i = output.size(); i != cols - 1; i++) {
                    output += " ";
                }
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << output << std::endl;
                
                _status = STATUS_WAITING;            
            } else if (_details == "Error") {
                std::string output = " (" + std::to_string(_do) + "/" + std::to_string(_todo) + ") name to add here";
                for (int i = output.size() - 1; i != 0; i--) {
                    output += " ";
                }
                std::cout << "\r" << COLOR_ERR << "✖" << COLOR_DEFAULT << output << std::endl;

                _status = STATUS_FINISHED;
            }
        }
        // Remove Section
        else if(_status == STATUS_UNINSTALL) {
            std::cout << "\r" << _loader << " (" << _do << "/" << _todo << ") " << "Uninstalling " << _item_name << std::flush;

            if (_details == "Error") {
                std::cout << "\r" << COLOR_ERR << "✖" << COLOR_DEFAULT << " (" << _do << "/" << _todo << ") " << _item_name << " Unable to remove           " << std::endl;
                _status = STATUS_WAITING;
            } else if (_details == "Finish") {
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << " (" << _do << "/" << _todo << ") " << _item_name << " Removed                  " << std::endl;
                _status = STATUS_WAITING;
            }
        }

        Utils::Cross::sleepMs(60);
    }

    std::cout << FONT_BOLD << COLOR_BLUE << "==>" << COLOR_DEFAULT << " All Done" << FONT_NORMAL << std::endl;

    auto err = download.get();
    return err;
}

Error Manager::Install() {
    std::cout << FONT_BOLD << COLOR_BLUE << "==>" << COLOR_DEFAULT << " Downloading Files" << FONT_NORMAL << std::endl;

    _do = 0;

    auto it = std::begin(_extension);
    while (it != std::end(_extension)) {
        _progress = 0;
        _item_name = it->getName();
        _status = STATUS_DOWNLOADING;

        auto downloadCallback = [&](float pourcent) {
            this->_progress = pourcent;
        };

        cpr::Response r = it->download(downloadCallback);

        if (r.status_code == 200) {
            _progress = 100;

            _do++;
            it++;
        } else {
            _progress = -1;
            it = _extension.erase(it);
        }

        while (_status != STATUS_WAITING);
    }
    
    // optimize this !!!
    if (_do == 0) {
        _status = STATUS_FINISHED;
        return ERR_CONNECTION;
    }

    std::cout << FONT_BOLD << COLOR_BLUE << "==>" << COLOR_DEFAULT << " Installing Extensions" << FONT_NORMAL << std::endl;

    _todo = _extension.size();
    _do = 0;
    
    for (auto &extension : _extension) {
        _status = STATUS_INSTALLING;
        _progress = -1;
        _item_name = extension.getName();

        auto updateDetails = [&](std::string new_details, float progress_details) {
            this->_details = new_details;
            this->_progress = progress_details;
        };

        auto err = extension.install(updateDetails);

        _do++;

        _details = (err.isNull()) ? "Finish" : "Error";
        if (_details == "Error") { return err; }

        while (_status != STATUS_WAITING);
        _details = "";
    }

    _status = STATUS_FINISHED;
    Error err(ERR_NONE);
    return err;
}

Error Manager::Remove() {
    std::cout << FONT_BOLD << COLOR_BLUE << "==>" << COLOR_DEFAULT << " Uninstalling Extensions" << FONT_NORMAL << std::endl;

    _todo = _extension.size();
    _do = 0;

    for (auto &extension : _extension) {
        _status = STATUS_UNINSTALL;
        _item_name = extension.getName();
        _do++;

        Error err = extension.uninstall();
        _details = (err.isNull()) ? "Finish" : "Error";

        while (_status != STATUS_WAITING);
        _details = "";
    }

    _status = STATUS_FINISHED;

    Error err(ERR_NONE);
    return err;
}

Error Manager::Update() {
    std::cout << FONT_BOLD << COLOR_BLUE << "==>" << COLOR_ERR << " Not Yet Implemented" << FONT_NORMAL << COLOR_DEFAULT << std::endl;
    _status = STATUS_FINISHED;
    return ERR_NONE;
}