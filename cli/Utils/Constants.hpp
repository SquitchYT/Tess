#ifndef CONSTTESS
#define CONSTTESS

#include <string>
#include <vector>

extern std::pair<int, std::string> ERR_NO_ARGS;
extern std::pair<int, std::string> ERR_UNKNOWN_ARG;
extern std::pair<int, std::string> ERR_NONE;
extern std::pair<int, std::string> ERR_DISK;
extern std::pair<int, std::string> ERR_DEFAULT;
extern std::pair<int, std::string> ERR_CONNECTION;
extern std::pair<int, std::string> ERR_NO_EXTENSION;
extern std::pair<int, std::string> ERR_NO_PKG_MANAGER;
extern std::pair<int, std::string> ERR_HELP_NEEDED;

extern std::string COLOR_ERR;
extern std::string COLOR_DEFAULT;
extern std::string COLOR_BLUE;
extern std::string COLOR_GREEN;

extern std::string FONT_BOLD;
extern std::string FONT_NORMAL;

extern std::string SERVER_URL;

extern std::vector<std::string> LOADERS;
extern std::vector<std::string> BAR_ELEMENTS;

extern std::string STATUS_DOWNLOADING;
extern std::string STATUS_INSTALLING;
extern std::string STATUS_FINISHED;
extern std::string STATUS_WAITING;
extern std::string STATUS_UNINSTALL;

extern std::vector<std::pair<std::string, std::string>> ARGS_ALLIAS;


#endif