file(GLOB SOURCES "*.cpp" "*.hpp")
add_library(Class ${SOURCES})

target_link_libraries(Class PRIVATE cpr::cpr)