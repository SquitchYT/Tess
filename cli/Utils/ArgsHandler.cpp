#include "ArgsHandler.hpp"
#include "../Class/Extension.hpp"
#include "../Class/Error.hpp"
#include "Constants.hpp"
#include <string>
#include <tuple>


std::tuple<Error, std::vector<Extension>, std::string> handleArgs(int count, char **args) {
    std::vector<Extension> extensions;

    std::string current_type = "";
    std::string action = "";

    if (count == 1) {
        Error err(ERR_HELP_NEEDED);
        return {err, extensions, action};
    }
    std::string first_arg = args[1];
    if (first_arg == "--help") {
        Error err(ERR_HELP_NEEDED);
        return {err, extensions, action};
    }

    for (int i = 0; i < count; i++) {
        std::string s = args[i];

        // Check if incorrect args
        if (s.rfind("-", 0) == 0) {
            bool isEquals = false;

            for (auto allias : ARGS_ALLIAS) {
                if (s == allias.first || s == allias.second) {
                    isEquals = true;
                }
            }

            if (!isEquals) {
                Error err(ERR_UNKNOWN_ARG, s);
                return {err, extensions, action};
            }
        }

        if (s == "--save" || s == "-S") {
            action = "install";
        } else if (s == "--remove" || s == "-R") {
            action = "remove";
        } else if (s == "--update" || s == "-U") {
            action = "update";
        }

        if (s == "--theme" || s == "-T") {
            current_type = "theme";
        } else if (s == "--plugin" || s == "-P") {
            current_type = "plugin";
        } else if(current_type != "") {
            Extension ext(s, current_type);
            extensions.push_back(ext);
        }
    }

    Error err( (action == "") ? ERR_NO_ARGS : (extensions.size() == 0 ) ? ERR_NO_EXTENSION : ERR_NONE, action );
    return {err, extensions, action};
}