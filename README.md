# alder 🌳
 A recursive directory listing program that supports file-size reporting, and pattern matching. Inspired by the [`tree`](http://www.computerhope.com/unix/tree.htm)
UNIX command.

![Alder: the better tree printer](http://i.imgur.com/8qhaxvG.png)

## Usage

```
  Usage: alder [options] [target]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -s, --sizes        Show file sizes in tree
    -e, --exclude <s>  Exclude files matching a pattern
    -i, --include <s>  Include only files that match a pattern
    -d, --depth <n>    Only render the tree to a specific depth
```