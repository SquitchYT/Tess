cmake_minimum_required(VERSION 3.20)

project(tess-cli)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(BUILD_SHARED_LIBS False)

add_definitions("-lpthread")

set(CMAKE_CXX_FLAGS "-O0 -Wall -Wextra")

add_executable(tess-cli main.cpp)

#set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})
#set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})

add_subdirectory(Utils)
add_subdirectory(Lib)
add_subdirectory(Class)

target_link_libraries(tess-cli PRIVATE Lib Class Utils)

include(FetchContent)
FetchContent_Declare(cpr GIT_REPOSITORY https://github.com/whoshuu/cpr.git GIT_TAG f4622efcb59d84071ae11404ae61bd821c1c344b)
set(CPR_BUILD_TESTS OFF CACHE INTERNAL "" FORCE)
FetchContent_MakeAvailable(cpr)

target_link_libraries(tess-cli PRIVATE cpr::cpr)