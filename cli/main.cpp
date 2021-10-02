#include <iostream>
#include <string>

#include <signal.h>

#include "Utils/argsHandler.hpp"
#include "Class/extention.hpp"
#include "Lib/Manager.hpp"
#include "Utils/Constant.hpp"
#include "Class/Error.hpp"
#include "Utils/cross.hpp"

#include <cpr/cpr.h>

void exit_handler() {
    std::cout << "\033[?25h";
}

int main(int argc, char **argv){
    atexit(exit_handler);
    signal(SIGINT, exit);
    std::cout << "\033[?25l";

    auto [err, extentions, action] = handleArgs(argc, argv);

    if (err.getCode() != 0) {
        std::cout << err << std::endl;
        return err.getCode();
    }

    Manager manager(extentions, action);
    err = manager.start();

    if (err.getCode() != 0) {
        std::cout << err << std::endl;
    }

    return err.getCode();
}

/* TODO
###############################################################.
# - Add warning class and warning for undowlaoded extention   #
# - Add error no installed plugin on remove                   #
# - Add updater                                               #
###############################################################
*/