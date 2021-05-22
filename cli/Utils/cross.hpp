#ifndef CROSS
#define CROSS

#include <tuple>
#include <string>

namespace Utils {
    namespace Cross{
        extern void sleepMs(int ms);
        extern void change_dir(std::string path);

        extern std::tuple<int, int> getTerminalSize();

        extern bool create_dir(std::string path);

        extern std::string getNodeJSPackageManager();


        // CHANGE THIS ???

        template<typename T>
        inline void toUpper(T &in) {
            int i = 0;
            for (auto c: in) {
                in[i] = toupper(c);
                i++;
            }
        }

        inline void toUpper(char &in) {
            in = toupper(in);
        }

        template<typename T>
        inline void toLower(T &in) {
            int i = 0;
            for (auto c : in) {
                in[i] = tolower(c);
                i++;
            }
        }

        inline void toLower(char &in) {
            in = tolower(in);
        }
    }
}

#endif