# alder 🌳
 A recursive directory listing program that supports file-size reporting, and pattern matching. Inspired by the [`tree`](http://www.computerhope.com/unix/tree.htm)
UNIX command.

![Alder: the better tree printer](http://i.imgur.com/8qhaxvG.png)

## Installation
`alder` should be installed globally using `yarn`.
```
yarn global add @aweary/alder
```
or with `npm`:
```
npm install -g @aweary/alder
```

## Usage

```
  Usage: alder [options] [target]

  Options:

    -h, --help           output usage information
    -a, --all            Print all files, including hidden files
    -d, --depth <n>      Only render the tree to a specific depth
    -D, --directories    Only print directories
    -e, --exclude <s>    Exclude files matching a pattern
    -f, --full           Print the full path prefix for each file
    -i, --no-indent      Tree will not print the indentation lines
    -I, --git-ignore     Exclude files in .gitignore
    -p, --include <s>   Include only files that match a pattern
    -s, --sizes          Show file sizes in tree
    -t, --time-stamp     Print the last modified date for each file
    -V, --version        output the version number
    --prune              Prune empty directories from the output
    --filelimit <n>      Do not descend directories that contain more than # entries
    --jsx                Print directory structure as JSX
```

### Exclude pattern

You can pass a string that will be parsed as a regular expression to `--exclude`:

```sh
# excluding single directory
alder --exclude=.git

# excluding multiple directories
alder --exclude=".git|bower_components|node_modules"
```

### Include pattern

You can pass a string that will be parsed as a regular expression to `--include`:

```sh
# including single file pattern
alder --include=package

# including multiple files patterns
alder --include="package|webpack"
```
