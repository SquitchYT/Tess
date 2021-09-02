cmake_minimum_required(VERSION 3.20)

project(tess-cli)

add_compile_options(-lcurl -lpthread)

add_executable(tess-cli main.cpp)

add_subdirectory(Utils)
add_subdirectory(Lib)
add_subdirectory(Class)

include(FetchContent)
FetchContent_Declare(cpr GIT_REPOSITORY https://github.com/whoshuu/cpr.git GIT_TAG f4622efcb59d84071ae11404ae61bd821c1c344b)
set(CPR_BUILD_TESTS OFF CACHE INTERNAL "" FORCE)
FetchContent_MakeAvailable(cpr)

target_link_libraries(tess-cli PRIVATE cpr::cpr)

target_link_libraries(tess-cli PUBLIC Utils)
target_link_libraries(tess-cli PUBLIC Lib)
target_link_libraries(tess-cli PUBLIC Class)
