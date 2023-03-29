![TODO](https://tessapp.dev/static/assets/website_thumbnail.png)

# Why another terminal?

Tess was mainly built in order to offer you a new, intuitive, fully customizable and blazing fast terminal app, by using the power of web technologies.

Why should you not test it? We work for more than 2 years on this, and we've been relied on by thousands of users.

Tess is currently officially tested on Windows & Linux, but it should work also on other platform.
If you cannot have access to Tess yet, fill an issue, we'll try to provide you the best cross-platform experience by making new packages or helping you manually installing Tess.

<br>
<br>

# Installation | Linux

## Requirements

* Have an OS with `x86` arch type
* `webkit2gtk` & `gtk3` installed

<br>

## Installation from archive

We provide package for most major distribution, simply select the one that match your distro and install it.

## Installation with PPA

If you prefer using apt over downloading and installing the `deb` archive. You could set up the PPA and download Tess with these
```bash
apt install curl apt-transport-https gnupg2

curl -s https://apt.tessapp.dev/key.gpg | gpg --dearmor | tee /usr/share/keyrings/tess.gpg > /dev/null

echo 'deb [signed-by=/usr/share/keyrings/tess.gpg] https://apt.tessapp.dev stable main' >> /etc/apt/sources.list.d/tess-packages.list

apt update && apt install tess
```

## Installation with AUR

On Arch Linux, the recommended way to install Tess is using an AUR package manager like [yay](https://github.com/Jguer/yay)
`yay -S tess-git`

## Installation with RPM repository

If you are on RHEL derivate distros, you could also want to add our RPM repository to install Tess and receive update automatically with your package manager

```bash
yum install curl 

curl https://rpm.tessapp.dev/tess.repo > /etc/yum.repos.d/tess.repo

yum check-update && yum install tess
```
<br>

# Installation | Windows

## Requirements

* `Windows 10 64 bits` or superior

<br>

## Installation from Installer

Simply download and execute the installer, available in the [releases](https://github.com/SquitchYT/Tess/releases) page.

## Installation using Winget

If you are running on `Windows 10 1709 (build 16299)` or superior, you could download [Winget](https://github.com/microsoft/winget-cli). It may also be already installed on your system.<br>
Next, execute the following command

```sh
winget install Squitch.Tess
```

## Installation using Chocolatey

Firstly, download [Chocolatey](https://chocolatey.org/install).<br>
Next, you will be allowed to run this

```sh
choco install tess
```

You can also find the package [here](https://community.chocolatey.org/packages/tess)

<br>
<br>

# Contributing

## Getting started

You want to contribute in Tess, find a simple task to help us with this project.

* You've found a mistake in documentations, code or in the wiki, let us know by opening an [issue](https://github.com/SquitchYT/Tess/issues).
* You've an amazing feature idea, simply post your suggestion by creating an issue too.
* You want to help us close an issue, implementing a feature or something else related to code, follow the guide below.

*Please, search for a similar issue before creating a new one.*

<br>

## Developing with Tess

You want to contribute to Tess, it's simply, fork the repository and start developing on it.

* As Tess is cross-platform, when you implement a new feature, try to make it available everywhere. If despite all your efforts, you are unable to make it cross-platform, let us know the supported platforms when submitting your changes.
* If you update code, explain why you think this change is important and what you've done.

After making your changes, simply open a [pull request](https://github.com/SquitchYT/Tess/pulls).

<br>
<br>

# Roadmap

As long as Tess is in beta, many bugs may occur and some of them have not yet been fixed.<br>
More, many features are not yet available, here's a quick recap of major features that will want to integrate in Tess.


|Features                 |Electron|Tauri|
|-------------------------|--------|-----|
|Translation              |❌      |⌛   |
|Tabs                     |✔️      |✔️   |
|Move tabs between windows|❌      |⌛   |
|Administrator tabs       |❌      |⌛   |
|Tabs split               |❌      |⌛   |
|Command line interface   |✔️      |⌛   |
|Notifications            |❌      |⌛   |
|Macros                   |❌      |⌛   |
|Plugins                  |🟠      |⌛   |
|Themes                   |🟠      |⌛   |
|Config page              |✔️      |⌛   |
|Config watching          |🟠      |⌛   |
|Image display            |❌      |⌛   |
|Font ligature            |🟠      |⌛   |
|Animated background      |❌      |⌛   |
|URI scheme API           |❌      |⌛   |
|Search in a shell        |❌      |⌛   |
|Marketplace              |❌      |⌛   |


*❌ **Not available**<br>*
*🟠 **Partially integrated**<br>*
*⌛ **Planned / In progress**<br>*
*✔️ **Integrated**<br>*
