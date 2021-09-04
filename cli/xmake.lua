set_project("tess-cli")
set_version("0.0.0")

add_rules("mode.debug", "mode.release")
set_languages("cxx17")

add_requires("cpr 1.6.2")

target("cli")
    set_kind("binary")

    add_files("**.cpp")
    add_headerfiles("**.hpp")

    add_syslinks("stdc++fs", "pthread")
    add_packages("cpr")
