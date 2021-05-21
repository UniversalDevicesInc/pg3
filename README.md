# pg3

Next-gen Polyglot root

## Creating a release:

> cd core
> npm run release

This is supposed to bump the version numbers, update git, push to github,
publish release on github, and install on NPM.  The program that does this
is called 'np'.

np will attempt to open a browser pointing to the github release draft. If
no browser, this needs to be done manually.


## Node server Developer HOWTO for PG3
-----------------------------------

### Packaging/releasing a node server
PG3 supports two ways of packaging a node server for release to users. It 
supports installations from a github.com git repository and installations from
a .zip or .tgz file.

Releasing a node server via github uses the same basic process that is PG2
uses.  First create a repository on github and make it publiclly accessible.
Then, using the developer portal web site, submit the github URL for
inclusion in the Node Server store.   Once accepted, it will show up in
the PG3 Node Server Store listing.  You may update the node server at any
time by pushing updates to the github repository. 

Support for installation from .zip/.tgz pre-packaged node servers is a new
feature of PG3.  Node servers should still be developed using a local git
repository, although this is not strickly necessary.  Use the zip or tar 
program to create the .zip or .tgz file of the node server directory.

Assumming your node server is in a directory like /usr/home/user/my_node_server

```sh
  cd /usr/home/users/my_node_server
  zip -r ../my_node_server.zip *
```
The goal is to crate a archive that doesn't contain any extra directory paths.
I.E. if you unzip -v my_node_server.zip you should not see the "my_node_server/" prepended to the file names.

Using the developer portal website, submit the .zip or .tgz file along with
the server.json file for inclusion in Node Server store.  Once accepted, it
will show up in the PG3 Node Server Store listing.  To update the node server
you must re-package and re-submit it via the developer portal website.

### Installing a local (non-store) node server
When you are developing a node server, you don't need to submit it for
inclusion in the store to install and test it.  PG3 allows you to install
from either a local pre-packaged file or directly from a local git 
repository. 

To install a local version, use the 'Install Local NodeServer' button on
the PG3 NodeServer Store screen.  This will prompt you for the node
server to install.  This can either be a local file/path to a .zip/.tgz file
like /home/user/my_node_server.zip or the path to a git repository like
/home/user/my_node_server/.  It can also be a URL for a remote git
repository like https://github.com/user/my_node_server

In all cases, it will install the node server as if it was installed from
the store, allowing you to test both the installation and functionallity
of the node server.

###  How does PG3 differ from PG3?
While the general design of a PG3 node server is very similar to the
general design of a PG2 node server there are some differences.  PG3 has
diverged enough that node servers are not compatible between the two 
systems.

#### The interface API
PG3 has a new Python interface API module.  The new interface is called
udi_interface. The documentation for the API is available along with the source
in the uid-python-interface git repository on github.

#### A real node server store
The PG3 node server store is now a real store, where users can purchase 
node servers and developer can be comopensated for the developement efforts.

The server.json file now requires a new element 'store' that holds the pricing
information and developer contact info. The following options are available
for node server purchasing.

1. Free.  A node server can still be released with no cost.
2. One time purchase.  A price can be set that allows the node server to be 
used indefinitily for a fixed price.
3. Subscription purchase.  A node server can be purchased for a fixed amount of time. The subscription period can be days, months, years. 
4. Trial subscription.  A node server can be installed for a trial period for no cost.  Once the trial period is over, the node server will require either a paid subscription or one-time purchase.

A node server can have multiple payment options.  I.E. one-time purchase price of $100 or $5 a month. However, some combinations may not make sense like having a trial period for a free node server.

#### PG3 supports multiple installations of the same node server
Unlike PG2, you can install multiple copies of the same node server.  This can 
be useful if the node server supports a single device and you have multiple
of those devices.

