#include "Constants.hpp"

#include <string>
#include <vector>

#ifdef _WIN32
#include <Windows.h>
#endif


std::pair<int, std::string> ERR_NO_ARGS = {11, "Please specifies an action to do. See tess-cli --help for more informations."};
std::pair<int, std::string> ERR_UNKNOWN_ARG = {14, "Unknown arguments: "};
std::pair<int, std::string> ERR_NONE = {0, ""};
std::pair<int, std::string> ERR_DISK = {10, "You don't have enough disk space."};
std::pair<int, std::string> ERR_DEFAULT = {255, "Unknown error"};
std::pair<int, std::string> ERR_CONNECTION = {12, "Unable to download extensions. Check your internet connection."};
std::pair<int, std::string> ERR_NO_EXTENSION = {13, "Please specifies one or more extensions to "};
std::pair<int, std::string> ERR_NO_PKG_MANAGER = {15, "Unable to find your NodeJS package manager. Please install it before."};
std::pair<int, std::string> ERR_HELP_NEEDED = {16, "Openning help"};

#ifdef _WIN32
        std::string COLOR_ERR = "\033[31m";
        std::string COLOR_DEFAULT = "\033[0m";
        std::string COLOR_BLUE = "\033[34m";
        std::string COLOR_GREEN = "\033[32m";
        std::string FONT_BOLD = "\033[1m";
        std::string FONT_NORMAL = "\033[0m";
#else
        std::string COLOR_ERR = "\e[38;5;1m";
        std::string COLOR_DEFAULT = "\e[39m";
        std::string COLOR_BLUE = "\e[38;5;4m";
        std::string COLOR_GREEN = "\e[38;5;2m";
        std::string FONT_BOLD = "\e[1m";
        std::string FONT_NORMAL = "\e[0m";
#endif


std::string SERVER_URL = "http://squitch.fr/assets/tess/marketplace/";

std::vector<std::string> LOADERS = {
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
};

std::vector<std::string> BAR_ELEMENTS = {
        "▏",
        "▎",
        "▍",
        "▌",
        "▋",
        "▊",
        "▉",
        "█"
};

std::string STATUS_DOWNLOADING = "DOWNLOADING";
std::string STATUS_INSTALLING = "INSTALLING";
std::string STATUS_FINISHED = "FINISHED";
std::string STATUS_WAITING = "WAITING";
std::string STATUS_UNINSTALL = "uninstall";


std::vector<std::pair<std::string, std::string>> ARGS_ALLIAS = {
        std::make_pair("-S", "--save"),
        std::make_pair("-R", "--remove"),
        std::make_pair("-T", "--theme"),
        std::make_pair("-P", "--plugin"),
        std::make_pair("-H", "--help"),
        std::make_pair("-U", "--upgrade")
};