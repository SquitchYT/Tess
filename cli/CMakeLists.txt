cmake_minimum_required(VERSION 3.20)

project(tess-cli)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(BUILD_SHARED_LIBS False)
set(APP_ICON_RESOURCE_WINDOWS "${CMAKE_CURRENT_SOURCE_DIR}/appicon.rc")

add_definitions("-lpthread")

if (UNIX)
    set(CMAKE_CXX_FLAGS "-O0 -Wall -Wextra")
endif (UNIX)

add_executable(tess-cli main.cpp ${APP_ICON_RESOURCE_WINDOWS})

add_subdirectory(Utils)
add_subdirectory(Lib)
add_subdirectory(Class)

target_link_libraries(tess-cli PRIVATE Lib Class Utils)

include(FetchContent)
FetchContent_Declare(cpr GIT_REPOSITORY https://github.com/whoshuu/cpr.git GIT_TAG f4622efcb59d84071ae11404ae61bd821c1c344b)
set(CPR_BUILD_TESTS OFF CACHE INTERNAL "" FORCE)
FetchContent_MakeAvailable(cpr)

target_link_libraries(tess-cli PRIVATE cpr::cpr)