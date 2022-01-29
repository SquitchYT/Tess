#include <iostream>
#include <string>
#include <signal.h>
#include "Utils/ArgsHandler.hpp"
#include "Class/Extension.hpp"
#include "Lib/Manager.hpp"
#include "Utils/Constants.hpp"
#include "Class/Error.hpp"
#include "Utils/Cross.hpp"
#include <cpr/cpr.h>


void exit_handler() {
    std::cout << "\033[?25h";
}

void print_help() {
    std::cout << "Tesscli - 0.5.4" << std::endl;
    std::cout << "   --help          Show this help" << std::endl;
    std::cout << "   -S, --save      Install the given extensions" << std::endl;
    std::cout << "   -R, --remove    Remove the given extensions" << std::endl;
    std::cout << "   --plugin        Plugin list to modify" << std::endl;
    std::cout << "   --theme         Theme list to modify" << std::endl;
    std::cout << "Example: tess-cli -S --theme comfy dracula --plugin discord-rpc" << std::endl << std::endl;
    std::cout << "View more help with man tess-cli" << std::endl;
}

int main(int argc, char **argv){
    atexit(exit_handler);
    signal(SIGINT, exit);
    std::cout << "\033[?25l";

    auto [err, extensions, action] = handleArgs(argc, argv);

    if (err.getCode() == 16) {
        print_help();
        return 0;
    } else if (err.getCode() != 0) {
        std::cout << err << std::endl;
        return err.getCode();
    }

    
    Manager manager(extensions, action);
    err = manager.start();

    if (err.getCode() != 0) {
        std::cout << err << std::endl;
    }

    return err.getCode();
}

/* TODO
###############################################################.
# - Add warning class and warning for no downloaded extension #
# - Add error no installed plugin on remove                   #
# - Add updater                                               #
###############################################################
*/