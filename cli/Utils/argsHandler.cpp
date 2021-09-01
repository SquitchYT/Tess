#include "argsHandler.hpp"

#include "../Class/extention.hpp"
#include "../Class/Error.hpp"
#include "Constant.hpp"

#include <string>
#include <tuple>
#include <list>


std::tuple<Error, std::vector<Extention>, std::string> handleArgs(int count, char **args) { //replace std::list by vector
    std::vector<Extention> extentions;

    std::string current_type = "";
    std::string action = "";

    if (count == 1) {
        Error err(ERR_NO_ARGS);
        return {err, extentions, action};
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
                Error err(ERR_UNKNOW_ARG, s);
                return {err, extentions, action};
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
            Extention ext(s, current_type);

            extentions.push_back(ext);
        }
    }

    Error err( (action == "") ? ERR_NO_ARGS : (extentions.size() == 0 ) ? ERR_NO_EXTENTION : ERR_NONE, action );
    return {err, extentions, action};
}