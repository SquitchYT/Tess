#ifndef LOADER
#define LOADER

#include <ostream>
#include <string>

class Loader
{
    private:
        int _current;

        void UpdateCurrent();


    public:
        friend std::ostream &operator<<(std::ostream &os, Loader &loader);

        Loader();
};


#endif