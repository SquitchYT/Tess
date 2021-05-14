#ifndef LOADER
#define LOADER

#include <iostream>

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