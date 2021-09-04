file(GLOB SOURCES "*.cpp" "*.hpp")
add_library(Lib ${SOURCES})

target_link_libraries(Lib PRIVATE cpr::cpr)