#include "Manager.hpp"

#include <iostream>
#include <unistd.h>
#include <string>
#include <future>
#include <thread>
#include <list>


#include "../Utils/ProgressBar.hpp"
#include "../Utils/Constant.hpp"
#include "../Utils/cross.hpp"

#include "../Class/extention.hpp"
#include "../Class/Loader.hpp"
#include "../Class/Error.hpp"


Manager::Manager(std::list<Extention> extentions, std::string action){
    _extention = extentions;
    _action = action;
    _status = STATUS_WAITING;

    _to_install = 0;
    _installed = 0;

    _install_details = "";
}

Error Manager::start(){
    std::future<std::pair<int, std::string>> download;

    // Try to switch !!! to switch
    if (_action == "install") {
        download = async(std::launch::async, &Manager::Install, this);
    } else if (_action == "remove") {
        download = async(std::launch::async, &Manager::Remove, this);
    } else if (_action == "update") {
        download = async(std::launch::async, &Manager::Update, this);
    } else {
        Error err(ERR_DISK);
        return err;
    }

    while (_status != STATUS_FINISHED)
    {
        auto [cols, rows] = Utils::Cross::getTerminalSize();
        int progressBarLenght = cols * 2 / 5;

        if (_status == STATUS_DOWNLOADING) {
            cols -= progressBarLenght + _item_name.length() + 2;

            //switch to a move cursor !
            std::string space;
            for (cols; cols != 0; cols--)
            {
                space += " ";
            }

            ProgressBar bar(progressBarLenght, _download_progress);
            std::cout << "\r" << _loader << " " <<  _item_name << space << bar << std::flush;

            if (_download_progress == 100) {
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << " " <<  _item_name << space << bar << std::endl;
                _status = STATUS_WAITING;
            } else if (_download_progress == -1) {
                std::cout << "\r" << COLOR_ERR << "✖" << COLOR_DEFAULT << " " <<  _item_name << space << bar << std::endl;
                _status = STATUS_WAITING;
            }
        } else if(_status == STATUS_INSTALLING || _status == STATUS_INSTALLING_WAITING_NEXT) {
            if (_install_progress != -1) {
                ProgressBar bar(progressBarLenght, _install_progress);

                std::string output = " (" + std::to_string(int(_installed + 1)) + "/" + std::to_string(_to_install) + ") " + _install_details;
                for (int i = cols - output.size() - progressBarLenght - 1; i != 0; i--) {
                    output += " ";
                }

                std::cout << "\r" << _loader << output << bar << std::flush;
            } else {
                std::string output = " (" + std::to_string(int(_installed + 1)) + "/" + std::to_string(_to_install) + ") " + _install_details;

                for (int i = cols - output.size() - 1; i != 0; i--) {
                    output += " ";
                }

                std::cout << "\r" << _loader << output << std::flush;
            }
            if (_status == STATUS_INSTALLING_WAITING_NEXT) {
                std::string output = " (" + std::to_string(_installed) + "/" + std::to_string(_to_install) + ") Installed !";

                for (int i = cols - output.size() - 1; i != 0; i--) {
                    output += " ";
                }
                
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << output << std::endl;

                _status = (_installed == _to_install) ? STATUS_FINISHED : STATUS_INSTALLING;
            }
        } else if(_status == STATUS_UNINSTALL) {
            std::cout << "\r" << _loader << " (" << _removed << "/" << _to_remove << ") " << _remove_details << std::flush;

            if (_remove_details == "failed") {
                std::cout << "\r" << COLOR_ERR << "✖" << COLOR_DEFAULT << " (" << _removed << "/" << _to_remove << ")                                                 " << std::endl;
                _remove_details = "";
            } else if (_remove_details == "succes") {
                std::cout << "\r" << COLOR_GREEN << "✔" << COLOR_DEFAULT << "(" << _removed << "/" << _to_remove << ")                                            " << std::endl;
                _remove_details = "";
            }
        }

        Utils::Cross::sleepMs(40);
    }

    std::cout << "download completed" << std::endl;

    /*
    // Return 0 if not finish and 1 if finished
    cout << (donwload.wait_for(chrono::milliseconds(0)) == future_status::ready) << endl;
    */

    Error err(download.get());

    return err;
}

std::pair<int, std::string> Manager::Install() {
    std::cout << "donwloading files..." << std::endl;

    int todo = _extention.size();
    int Do = 0;

    for (std::list<Extention>::iterator it = _extention.begin(); it != _extention.end();) {
        _download_progress = 0;
        _item_name = it->getName();
        _status = STATUS_DOWNLOADING;

        auto downloadCallback = [&](int pourcent) {
            this->_download_progress = pourcent;
        };

        cpr::Response r = it->download(downloadCallback);

        if (r.status_code == 200) {
            _download_progress = 100;

            Do++;
            it++;
        } else {
            _download_progress = -1;
            it = _extention.erase(it);
        }

        Utils::Cross::sleepMs(70);
    }
    
    // optimize this !!!
    if (Do == 0) {
        _status = STATUS_FINISHED;
        return ERR_CONNECTION;
    }

    _to_install = _extention.size();

    for (auto &extention : _extention) {
        _status = STATUS_INSTALLING;

        auto updateDetails = [&](std::string new_details, int progress_details) {
            this->_install_details = new_details;
            this->_install_progress = progress_details;
        };

        extention.install(updateDetails);

        _installed++;

        _status = STATUS_INSTALLING_WAITING_NEXT;

        // check if more conventianal way for wait until var is equals to (MUTEX ???!!!)
        while (_status != STATUS_INSTALLING && _status != STATUS_FINISHED);
    }

    return ERR_NONE;
}

std::pair<int, std::string> Manager::Remove() {
    std::cout << "Removing..." << std::endl;

    _status = STATUS_UNINSTALL;
    _to_remove = _extention.size();

    auto removeCallback = [&](std::string status) {
        _remove_details = status;
    };

    for (std::list<Extention>::iterator it = _extention.begin(); it != _extention.end(); it++) {
        _removed++;

        Error err = it->uninstall(removeCallback);
        _remove_details = (err.isNull()) ? "succes" : "failed";

        while (_remove_details != "");
    }

    _status = STATUS_FINISHED;

    return ERR_NONE;
}

std::pair<int, std::string> Manager::Update() {
    std::cout << "Not yet implemented" << std::endl;
    _status = STATUS_FINISHED;
    return ERR_NONE;
}