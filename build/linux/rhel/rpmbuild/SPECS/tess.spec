Name:           tess
Version:        {{ VERSION }}
Release:        0
Summary:        Tess is an terminal emulator
License:        MPL-2.0
Source0:        tess.tar.gz
URL:            https://tessapp.dev
BuildArch:      x86_64
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
mkdir -p "$RPM_BUILD_ROOT/usr/share/man/en/man1"
cp tess.desktop "$RPM_BUILD_ROOT/usr/share/applications/"
cp icon.png "$RPM_BUILD_ROOT/usr/share/pixmaps/tess.png"
cp open-tess-here.desktop "$RPM_BUILD_ROOT/usr/share/kservices5/ServiceMenus/"
cp open-app-in-tess.desktop "$RPM_BUILD_ROOT/usr/share/kservices5/ServiceMenus/"
cp -r app/* "$RPM_BUILD_ROOT/usr/lib/tess/"
ln -s "/usr/lib/tess/tess" "$RPM_BUILD_ROOT/usr/bin/tess"
cp man-fr/tess.1 "$RPM_BUILD_ROOT/usr/share/man/fr/man1/"
cp man-fr/tess-cli.1 "$RPM_BUILD_ROOT/usr/share/man/fr/man1/"
cp man-en/tess.1 "$RPM_BUILD_ROOT/usr/share/man/en/man1/"
cp man-en/tess-cli.1 "$RPM_BUILD_ROOT/usr/share/man/en/man1/"

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
/usr/share/man/en/man1/*