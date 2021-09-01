#include "cross.hpp"

#include <time.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <filesystem>
#include <string>
#include <thread>


void Utils::Cross::sleepMs(int ms) {
    std::this_thread::sleep_for(std::chrono::milliseconds(ms));
}

std::tuple<int, int> Utils::Cross::getTerminalSize() {
    struct winsize w;

    //A COMPRENDRE COMMENT FONCTION IOCTL() !!!
    ioctl(1, TIOCGWINSZ, &w);

    return {w.ws_col, w.ws_row};
}

bool Utils::Cross::create_dir(std::string path)  {
    return std::filesystem::create_directories(path);
};

void Utils::Cross::change_dir(std::string path) {
    if (path.rfind("./", 0) == 0) {
        path.erase(0, 2);

        std::string current_path = std::filesystem::current_path();

        auto y = current_path + "/" + path;
        std::filesystem::current_path(y);
    } else {
        std::filesystem::current_path(path);
    }
}

std::string Utils::Cross::getNodeJSPackageManager() {
    if (!system("which yarn > /dev/null 2>&1")) {
        return "yarn";
    } else if (!system("which pnpm > /dev/null 2>&1")) {
        return "pnpm";
    } else if (!system("which npm > /dev/null 2>&1")) {
        return "npm";
    } else { return "NO"; }
}
