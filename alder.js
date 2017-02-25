#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const prettybytes = require('pretty-bytes')
const chalk = require('chalk')
const program = require('commander')
const tinytime = require('tinytime')
const minimatch = require('minimatch')

program.version('1.0.0')
  .arguments('[target]')
  .option('-a, --all', 'Print all files, including hidden files')
  .option('-d, --depth <n>', 'Only render the tree to a specific depth', parseInt)
  .option('-D, --directories', 'Only print directories')
  .option('-e, --exclude <s>', 'Exclude files matching a pattern')
  .option('-f, --full', 'Print the full path prefix for each file')
  .option('-i, --no-indent', 'Tree will not print the indentation lines')
  .option('-I, --git-ignore', 'Exclude files in .gitignore')
  .option('-p, --include <s>', 'Pattern to include only files that match a pattern')
  .option('-s, --sizes', 'Show file sizes in tree')
  .option('-t, --time-stamp', 'Print the last modified date for each file')
  .option('--prune', 'Prune empty directories from the output')
  .option('--filelimit <n>', 'Do not descend directories that contain more than # entries', parseInt)
  .option('--jsx', 'Print directory structure as JSX')
  .parse(process.argv)

/**
 * Whitespace is included for easy-on-the-eyes padding
 */
const BOX_BOTTOM_LEFT = ' └── '
const BOX_INTERSECTION = ' ├── '
const BOX_VERTICAL = ' │  '
const EMPTY = '    '

const input = program.args[0] || '.';
const cwd = process.env.PWD;
const root = path.resolve(cwd, input)
const maxDepth = program.depth || Infinity
const fileLimit = program.filelimit || Infinity
const showSize = program.sizes
const showFullPath = !!program.full
const showAllFiles = !!program.all
const showTimeStamp = !!program.timeStamp
const showOnlyDirectories = !!program.directories
const hideFilesInGitIgnore = !!program.gitIgnore
const pruneEmptyDirectories = !!program.prune
const printJSX = program.jsx
const shouldIndent =  typeof program.indent === 'undefined' ? true : program.indent
const hasExcludePattern = typeof program.exclude !== 'undefined'
const hasIncludePattern = typeof program.include !== 'undefined'
const excludePattern = new RegExp(program.exclude)
const includePattern = new RegExp(program.include)
const dateTemplate = tinytime('[{MM} {DD} {h}:{mm}]  ', { padDays :true, padHours: true })

if (hasExcludePattern && hasIncludePattern) {
  throw new Error('Exclude patterns and include patterns cannot be used together.')
}

let output = '\n ' + input + '\n'

const colors = ['blue', 'magenta', 'cyan', 'red', 'white']
const depths = {}

let fileCount = 0
let directoryCount = 0
let totalFileSize = 0

/**
 * If available, it reads the `.gitignore` file in the current
 * directory and parses it into a list of glob patterns, removing
 * empty lines and comments
 */
function readGitignore(directory) {
  const gitignorePath = `${directory}/.gitignore`
  try {
    const gitignoreRaw = fs.readFileSync(gitignorePath, 'utf-8')
    const gitignoreList = gitignoreRaw.split('\n')
      .filter(function (line) {
        return line !== '' && !line.startsWith('#')
      })
      .map(function (line) {
        // lines such as `/node_modules` in `.gitignore` are not used
        // the same way by minimatch. In order for the matching to work
        // we need to remove the starting `/`
        return line.startsWith('/') ? line.slice(1) : line
      })
    return gitignoreList
  } catch (e) {
    return []
  }
}

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
  if (!shouldIndent) {
    return ''
  }
  let prefix = bottom ? BOX_BOTTOM_LEFT : BOX_INTERSECTION
  let spacing = []
  let spaceIndex = 0
  while(spaceIndex < depth) {
    spacing[spaceIndex] = depths[spaceIndex] && !printJSX ? BOX_VERTICAL : EMPTY
    spaceIndex++
  }
  return printJSX ? spacing.join('') : spacing.join('') + prefix
}

/**
 * Uses either the exclude or include pattern to determine
 * if a file should be shown.
 * @param {String} file   filename
 */
function shouldBeIncluded(file) {

  if (!showAllFiles && file[0] === '.') {
    return false
  }
  if (hasExcludePattern) {
    return !excludePattern.test(file)
  }
  if (hasIncludePattern) {
    return includePattern.test(file)
  }
  return true
}

function createJSXTags(filename, isDirectory, size, fullPath) {
  const tag = isDirectory ? 'dir' : 'file'
  const empty = isDirectory && (fs.readdirSync(fullPath).length > 0)
  return {
    open: empty && (fs.readdirSync(fullPath).length > 0)
      ? `<${tag} ${isDirectory ? '' : chalk.cyan("size=")}"${size}" ${chalk.cyan("name=")}"${filename}">`
      : `<${tag} ${chalk.cyan("size=")}"${size}" ${chalk.cyan("name=")}"${filename}" />`,
    close: empty ? `</${tag}>` : null
  }
}

/**
 * Depth-first recursive traversal utility for
 * building up the output string.
 */
function buildTree(directory, depth, parentGitignoreList) {
  const files = fs.readdirSync(directory);
  const max_index = files.length - 1
  const color = chalk[colors[depth % colors.length]]
  parentGitignoreList = parentGitignoreList || []
  const gitignoreList = hideFilesInGitIgnore
    ? parentGitignoreList.concat(readGitignore(directory))
    : []

  for (let i = 0; i <= max_index; i++) {
    const file = files[i]
    depths[depth] = max_index - i
    const fullPath = path.resolve(directory, file)
    let printWithoutDescending = false
    let postfix = ''
    let prefix = buildPrefix(depth, i === max_index, directory)
    const stats = fs.statSync(fullPath)
    const isDirectory = stats.isDirectory()
    const size = prettybytes(stats.size)

    if (showTimeStamp) {
      prefix += dateTemplate.render(new Date(stats.mtime))
    }

    if (isDirectory) {
      directoryCount++
    } else {
      fileCount++
      totalFileSize += stats.size
    }

    if (!shouldBeIncluded(file)) {
      continue
    }

    if (hideFilesInGitIgnore) {
      let matchesGitIgnoreEntry = false
      let m = gitignoreList.length
      while (!matchesGitIgnoreEntry && m > 0) {
        matchesGitIgnoreEntry = minimatch(file, gitignoreList[m - 1])
        m--
      }

      if (matchesGitIgnoreEntry) {
        continue
      }
    }

    if (!isDirectory && showOnlyDirectories) {
      continue
    }

    if (isDirectory) {
      if (fileLimit !== Infinity || pruneEmptyDirectories) {
        const dirfiles = fs.readdirSync(fullPath).filter(shouldBeIncluded)
        if (pruneEmptyDirectories && dirfiles.length === 0) {
          continue
        }
        if (dirfiles.length > fileLimit) {
          printWithoutDescending = true
          postfix = ` [${dirfiles.length} entries exceeds filelimit (${fileLimit}), not opening dir]`
        }
      }
    }

    const filename = showFullPath ? color(fullPath.replace(cwd + '/', '')) : color(file)
    const JSXTags = createJSXTags(filename, isDirectory, size, fullPath)

    if (printJSX) {
      output += prefix + JSXTags.open + '\n'
    } else {
      output += prefix + filename + (!isDirectory && showSize ? ` (${size})` : '') + postfix + '\n';
    }
    if (printWithoutDescending) {
      continue
    }
    if (isDirectory && (depth + 1 < maxDepth)) {
      buildTree(path.resolve(directory, file), depth + 1, gitignoreList)
    }
    if (printJSX && JSXTags.close) {
      output += prefix + JSXTags.close + '\n'
    }
    --depths[depth]
  }
}
// Kick off the recursive printing process.
buildTree(root, 0)

output += directoryCount + ' directories, '
output += fileCount + ' files'
output += ' (' + prettybytes(totalFileSize) + ')\n'

process.stdout.write(output)
