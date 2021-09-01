#include "extention.hpp"

#include "../Utils/Constant.hpp"

#include <string>
#include <string.h>
#include <functional>
#include <fstream>
#include <iostream>
#include <filesystem>

#include "../Lib/external/cpr/include/cpr/cpr.h"

#include "../Lib/Manager.hpp"
#include "../Utils/cross.hpp"

#include "../Class/Error.hpp"


Extention::Extention(std::string name, std::string type) {
    _type = type;
    _name = name;

    Utils::Cross::toUpper(_name[0]);

    std::string a =  (_type == "theme") ? ".json" : ".manifest";
    _url = SERVER_URL + type + "/" + name + a;
}

std::string Extention::getName() {
    return _name;
}

std::string Extention::getType() {
    return _type;
}

std::string Extention::getUrl() {
    return _url;
}

cpr::Response Extention::download(std::function<void (int)> callback) {

    cpr::Response r = cpr::Get(cpr::Url{_url},         
    cpr::ProgressCallback([&](size_t downloadTotal, size_t downloadNow, size_t uploadTotal, size_t uploadNow) -> bool
    {
        if(static_cast<int>(downloadTotal) != 0) {
            int pourcent = static_cast<float>(downloadNow) / static_cast<float>(downloadTotal) * 100;
            callback(pourcent);
        }

        return true;
    }));

    _content = r.text;

    return r;
}

Error Extention::install(std::function<void (std::string, int)> callback) {
    Utils::Cross::toLower(_name);

    if (_type == "theme") {
        callback("Installing theme ...", -1);

        std::ofstream file((std::string)std::getenv("HOME") + "/Applications/tess/config/theme/" + _name + ".json");
        file << _content;
        file.close();

        Utils::Cross::toUpper(_name[0]);

        Error err(ERR_NONE);
        return err;
    } else {
        callback("Preparing installation...", -1);

        std::stringstream content;
        content << _content;

        std::string line;

        std::vector<std::pair<std::string, std::string>> dependencies;
        bool dependencies_check = false;

        while(std::getline(content, line)) {
            callback("Getting dependencies", -1);

            if (dependencies_check && line.rfind("[") != 0) {
                dependencies.push_back(std::make_pair(SERVER_URL + _type + "/" + _name + "/" + line, line));
            } else {
                dependencies_check = (line.rfind("[dependencies]") == 0) ? true : false;
            }
        }

        int Do = 0;
        int todo = dependencies.size();
        double progress = 0;

        callback("Installing dependencies", 0);

        for (auto url : dependencies) {
            int download_progress = 0;

            cpr::Response r = cpr::Get(cpr::Url{url.first},
            cpr::ProgressCallback([&](size_t downloadTotal, size_t downloadNow, size_t uploadTotal, size_t uploadNow) -> bool
            {
                if(static_cast<int>(downloadTotal) != 0) {
                    download_progress = static_cast<float>(downloadNow) / static_cast<float>(downloadTotal) * 100;
                }

                progress = static_cast<float>(download_progress / 100.0F) * (1.0F / static_cast<float>(todo));
                progress += static_cast<float>(Do) / static_cast<float>(todo);

                callback("Installing dependencies", progress * 100);

                return true;
            }));


            if (r.status_code == 200) {
                Utils::Cross::create_dir((std::string)std::getenv("HOME") + "/Applications/tess/plugins/" + _name);
                std::ofstream file((std::string)std::getenv("HOME") + "/Applications/tess/plugins/" + _name + "/" + url.second);
                file << r.text;
                file.close();
            }

            Do++;
            progress = static_cast<float>(Do) / static_cast<float>(todo);

            callback("Installing dependencies", progress * 100);
        }

        callback("Installing dependencies", 100);
        Utils::Cross::sleepMs(100);
        callback("Installing Node.js dependencies", -1);

        // Fix print save into nul file
        Utils::Cross::change_dir((std::string)std::getenv("HOME") + "/Applications/tess/plugins/" + _name);

        std::string packageManager = Utils::Cross::getNodeJSPackageManager();
        if (packageManager != "NO") {
            packageManager += " install >/dev/null 2>&1";
            system(packageManager.c_str());
            callback("Finishing ...", -1);

            Error err(ERR_NONE);
            return err;
        } else {
            callback("Unable to find a NodeJS package manager. Please intall it before.", ERR_INSTALLING);

            Error err(ERR_NO_PKG_MANAGER);
            return err;
        }
    }   
}

Error Extention::uninstall() {
    if (_type == "theme") {
        Utils::Cross::change_dir((std::string)getenv("HOME") + "/Applications/tess/config/theme/");
        Utils::Cross::toLower(_name);
        
        if (!std::filesystem::remove("./" + _name + ".json")) {
            Error err(ERR_DISK);
            return err;
        }
    } else {
        Utils::Cross::change_dir((std::string)getenv("HOME") + "/Applications/tess/plugins");
        Utils::Cross::toLower(_name);

        if (std::filesystem::remove_all("./" + _name) == 0) {
            Error err(ERR_DISK);
            return err;
        }
    }

    Error err(ERR_NONE);
    return err;

}