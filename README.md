# pg3

Next-gen Polyglot root

Building a release:

> cd core
> npm run release

This is supposed to bump the version numbers, update git, push to github,
publish release on github, and install on NPM.  The program that does this
is called 'np'.

np will attempt to open a browser pointing to the github release draft. If
no browser, this needs to be done manually.
