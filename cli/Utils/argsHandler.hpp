#ifndef ARGSHANDLER
#define ARGSHANDLER

#include <string>
#include <tuple>
#include <list>

#include "../Class/Error.hpp"
#include "../Class/Extension.hpp"

std::tuple<Error, std::vector<Extension>, std::string> handleArgs(int count, char **args);


#endif