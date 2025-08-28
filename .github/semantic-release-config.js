/**
 * Custom Semantic Release Configuration
 * Forces minor version increment even without conventional commits
 */

module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          // Breaking changes trigger major version
          {breaking: true, release: 'major'},
          // Features trigger minor version
          {type: 'feat', release: 'minor'},
          // Everything else (including no conventional commit) triggers minor
          {type: 'fix', release: 'minor'},
          {type: 'perf', release: 'minor'},
          {type: 'revert', release: 'minor'},
          {type: 'docs', release: 'minor'},
          {type: 'style', release: 'minor'},
          {type: 'refactor', release: 'minor'},
          {type: 'test', release: 'minor'},
          {type: 'build', release: 'minor'},
          {type: 'ci', release: 'minor'},
          {type: 'chore', release: 'minor'},
          // Catch-all rule for non-conventional commits
          {type: null, release: 'minor'},
          {scope: null, release: 'minor'},
          {subject: null, release: 'minor'}
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
        }
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'angular',
        writerOpts: {
          commitsSort: ['subject', 'scope']
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'CHANGELOG.md',
          'package.json',
          'package-lock.json'
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: '🎉 This PR is included in version ${nextRelease.version} 🎉\n\nThe release is available on:\n- [GitHub Container Registry](https://ghcr.io/badal-io/claude-flow-dagger:${nextRelease.version})\n- [GitHub Release](https://github.com/badal-io/claude-flow-dagger/releases/tag/v${nextRelease.version})\n\nDocker pull command:\n```bash\ndocker pull ghcr.io/badal-io/claude-flow-dagger:${nextRelease.version}\n```',
        releasedLabels: ['released'],
        addReleases: 'bottom'
      }
    ],
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd: "echo \"new_release_published=true\" >> $GITHUB_OUTPUT && echo \"new_release_version=${nextRelease.version}\" >> $GITHUB_OUTPUT && echo \"new_release_major_version=${nextRelease.version.split('.')[0]}\" >> $GITHUB_OUTPUT && echo \"new_release_minor_version=${nextRelease.version.split('.')[1]}\" >> $GITHUB_OUTPUT && echo \"new_release_patch_version=${nextRelease.version.split('.')[2]}\" >> $GITHUB_OUTPUT"
      }
    ]
  ]
};