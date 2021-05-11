#include "argsHandler.hpp"

#include "../Class/extention.hpp"
#include "../Class/Error.hpp"
#include "Constant.hpp"

#include <string>
#include <vector>
#include <tuple>
#include <list>

/*
 ###################
 #NEED IMPROVEMENT#
 ##################
*/
std::tuple<Error, std::list<Extention>, std::string> handleArgs(int count, char **args) {
    std::list<Extention> extentions;

    std::string current_type = "";
    std::string action = "";

    if (count == 1) {
        Error err(ERR_ARGS);
        return {err, extentions, action};
    }

    for (int i = 0; i < count; i++) {
        std::string s = args[i];

        //###############################
        //#Rework all of this to end !!!#
        //###############################
        // Check if incorrect args
        if (s.rfind("-", 0) == 0) {
            bool isEquals = false;

            for (auto allias : ARGS_ALLIAS) {
                if (s == allias.first || s == allias.second) {
                    isEquals = true;
                }
            }

            if (!isEquals) {
                Error err(ERR_ARGS, s);

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

    if (extentions.size() == 0) {
        Error err(ERR_NO_EXTENTION);
        return {err, extentions, action};
    }

    Error err(action == "" ? ERR_ARGS : ERR_NONE);

    return {err, extentions, action};
}