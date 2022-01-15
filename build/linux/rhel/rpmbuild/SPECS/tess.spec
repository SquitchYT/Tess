Name:           tess
Version:        {{ VERSION }}
Release:        0
Summary:        Tess is an terminal emulator
License:        GPL
Source0:        tess.tar.gz
%%description
Tess is a hackable, simple, rapid and beautiful terminal for the new era of technology.
%%global debug_package %%{nil}
%%prep
%%setup -q
%%build
%%install
rm -rf $RPM_BUILD_ROOT
mkdir -p "$RPM_BUILD_ROOT/usr/bin/"
mkdir -p "$RPM_BUILD_ROOT/usr/lib/tess/"
mkdir -p "$RPM_BUILD_ROOT/usr/share/applications/"
mkdir -p "$RPM_BUILD_ROOT/usr/share/pixmaps/"
mkdir -p "$RPM_BUILD_ROOT/usr/share/kservices5/ServiceMenus/"
mkdir -p "$RPM_BUILD_ROOT/usr/share/man/fr/man1"
cp Tess.desktop "$RPM_BUILD_ROOT/usr/share/applications/"
cp icon.png "$RPM_BUILD_ROOT/usr/share/pixmaps/tess.png"
cp tesshere.desktop "$RPM_BUILD_ROOT/usr/share/kservices5/ServiceMenus/"
cp appintess.desktop "$RPM_BUILD_ROOT/usr/share/kservices5/ServiceMenus/"
cp -r app/* "$RPM_BUILD_ROOT/usr/lib/tess/"
ln -s "/usr/lib/tess/tess" "$RPM_BUILD_ROOT/usr/bin/tess"
cp tess.1 "$RPM_BUILD_ROOT/usr/share/man/fr/man1/"
cp tess-cli.1 "$RPM_BUILD_ROOT/usr/share/man/fr/man1/"

cp -r cli/tess-cli "$RPM_BUILD_ROOT/usr/bin/tess-cli"
if type "$kbuildsycoca5" > /dev/null; then
kbuildsycoca5
fi
%%files
/usr/bin/*
/usr/lib/tess/*
/usr/share/applications/*
/usr/share/pixmaps/*
/usr/share/kservices5/ServiceMenus/*
/usr/share/man/fr/man1/*