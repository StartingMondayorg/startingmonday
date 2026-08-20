const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.(ts|tsx)$/,
  /\/__tests__\//,
]

const UI_SHELL_PATTERNS = [
  /^src\/app\/(?!api\/).*\.tsx$/,
  /^src\/components\//,
]

export function isUiShellFile(filePath) {
  return UI_SHELL_PATTERNS.some((pattern) => pattern.test(filePath))
}

export function isUnitCoverageSourceFile(filePath) {
  return !TEST_FILE_PATTERNS.some((pattern) => pattern.test(filePath)) && !isUiShellFile(filePath)
}