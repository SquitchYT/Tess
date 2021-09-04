file(GLOB SOURCES "*.cpp" "*.hpp")
add_library(Utils ${SOURCES})

target_link_libraries(Utils PRIVATE cpr::cpr)