#include "cross.hpp"

#include <time.h>

#ifdef __linux__ 
    #include <unistd.h>
    #include <sys/ioctl.h>
#elif _WIN32
    #include <windows.h>
#endif


#include <filesystem>
#include <string>
#include <thread>

void Utils::Cross::sleepMs(int ms) {
    std::this_thread::sleep_for(std::chrono::milliseconds(ms));
}

std::tuple<int, int> Utils::Cross::getTerminalSize() {
    #ifdef __linux__ 
        struct winsize w;
    //A COMPRENDRE COMMENT FONCTION IOCTL() !!!
        ioctl(1, TIOCGWINSZ, &w);

        return {w.ws_col, w.ws_row};
    #elif _WIN32
        CONSOLE_SCREEN_BUFFER_INFO csbi;
        int columns, rows;

        GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE), &csbi);
        columns = csbi.srWindow.Right - csbi.srWindow.Left + 1;
        rows = csbi.srWindow.Bottom - csbi.srWindow.Top + 1;

        return {columns, rows};

    #endif
}

bool Utils::Cross::create_dir(std::string path)  {
    return std::filesystem::create_directories(path);
};

void Utils::Cross::change_dir(std::string path) {
    if (path.rfind("./", 0) == 0) {
        path.erase(0, 2);

        std::string current_path;

        #ifdef __linux__
            current_path = std::filesystem::current_path();
        #elif _WIN32
            current_path = std::filesystem::current_path().string();
        #endif

        auto y = current_path + "/" + path;
        std::filesystem::current_path(y);
    } else {
        std::filesystem::current_path(path);
    }
}

std::string Utils::Cross::getNodeJSPackageManager() {
    #ifdef _WIN32
        if (!system("where.exe yarn > nul 2>nul")) {
            return "yarn";
        } else if (!system("where.exe pnpm >nul 2>nul")) {
            return "pnpm";
        } else if (!system("where.exe npm >nul 2>nul")) {
            return "npm";
        } else { return "NO"; }
    #else
        if (!system("which yarn > /dev/null 2>&1")) {
            return "yarn";
        } else if (!system("which pnpm > /dev/null 2>&1")) {
            return "pnpm";
        } else if (!system("which npm > /dev/null 2>&1")) {
            return "npm";
        } else { return "NO"; }
    #endif

    // replace which with windows 
}
