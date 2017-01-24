#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const prettybytes = require('pretty-bytes')
const chalk = require('chalk')
const random = require('unique-random-at-depth')
const argv = require('yargs').argv

/**
 * Whitespace is included for easy-on-the-eyes padding
 */
const BOX_BOTTOM_LEFT = ' └── '
const BOX_INTERSECTION = ' ├── '
const BOX_VERTICAL = ' │  '
const EMPTY = '    '

const input = argv._[0] || '.';
const cwd = process.env.PWD;
const target = path.resolve(cwd, input)
const useColors = typeof argv.colors === 'undefined' ? true : argv.colors
const maxDepth = argv.depth || Infinity
const hasIgnorePattern = typeof argv.ignore !== 'undefined'
const hasIncludePattern = typeof argv.include !== 'undefined'
const showSize = argv.sizes || argv.size
const ignorePattern = new RegExp(argv.ignore)
const includePattern = new RegExp(argv.include)

if (hasIgnorePattern && hasIncludePattern) {
  throw new Error('Ignore patterns and include patterns cannot be used together.')
}

let output = '\n ' + input + '\n'

const colors = ['blue', 'magenta', 'cyan', 'red', 'white']
const depths = {}

let fileCount = 0
let directoryCount = 0
let totalFileSize = 0

/**
 * Pads filenames with either whitespace or box characters.
 * The depths map is used to track whether a character should
 * be whitespace or a vertical character. Typically it will
 * be whitespace if there are no other files at that depth
 * that need to be rendered.
 * @param {Number}  depth   the level at which this file/filder is nested
 * @param {Boolean} bottom  whether this is the last file in the folder
 */
function buildPrefix(depth, bottom) {
  let prefix = bottom ? BOX_BOTTOM_LEFT : BOX_INTERSECTION
  let spacing = []
  let spaceIndex = 0
  while(spaceIndex < depth) {
    spacing[spaceIndex] = depths[spaceIndex] ? BOX_VERTICAL : EMPTY
    spaceIndex++
  }
  return spacing.join('') + prefix
}

/**
 * Uses either the ignore or include pattern to determine
 * if a file should be shown.
 * @param {String} file   filename
 */
function shouldBeIncluded(file) {
  let isIncluded = false
  let isIgnored = false
  if (hasIgnorePattern) {
    return !ignorePattern.test(file)
  }
  if (hasIncludePattern) {
    return includePattern.test(file)
  }
  return true
} 

/**
 * Depth-first recursive traversal utility for
 * building up the output string.
 */
function buildTree(directory, depth) {
  const files = fs.readdirSync(directory);
  const max_index = files.length - 1
  const color = chalk[colors[depth % colors.length]]

  for (let i = 0; i <= max_index; i++) {
    const file = files[i]
    depths[depth] = max_index - i
    const fullPath = path.resolve(directory, file)
    const prefix = buildPrefix(depth, i === max_index, directory)
    const stats = fs.statSync(fullPath)
    const isDirectory = stats.isDirectory()
    const size = prettybytes(stats.size)

    if (isDirectory) {
      directoryCount++
    } else {
      fileCount++
      totalFileSize += stats.size
    }

    if (!isDirectory && !shouldBeIncluded(file)) {
      return
    }

    const filename = useColors ? color(file) : file
    output += prefix + filename + (!isDirectory && showSize ? ` (${size})` : '') + '\n';
    if (isDirectory && (depth + 1 < maxDepth)) {
      buildTree(path.resolve(directory, file), depth + 1)
    }
    --depths[depth]
  }
}
// Kick off the recursive printing process.
buildTree(target, 0)

output += directoryCount + ' directories, '
output += fileCount + ' files'
output += ' (' + prettybytes(totalFileSize) + ')\n'

process.stdout.write(output)